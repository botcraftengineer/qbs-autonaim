import {
  and,
  conversation,
  conversationMessage,
  desc,
  eq,
  interviewScoring,
  sql,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getAIModel, logResponseEvent } from "@qbs-autonaim/lib";
import { AgentFactory } from "@qbs-autonaim/prompts";
import {
  createInterviewScoring,
  getInterviewContext,
  saveQuestionAnswer,
} from "../../../../services/interview";
import { inngest } from "../../../client";

/**
 * Функция для завершения интервью и создания скоринга
 * Может быть запущена независимо
 */
export const completeInterviewFunction = inngest.createFunction(
  {
    id: "complete-interview",
    name: "Complete Interview and Create Scoring",
    retries: 3,
  },
  { event: "telegram/interview.complete" },
  async ({ event, step }) => {
    const {
      conversationId,
      transcription,
      reason,
      questionNumber,
      responseId,
    } = event.data;

    console.log("🏁 Интервью завершено", {
      conversationId,
      totalQuestions: questionNumber,
      reason,
    });

    await step.run("save-last-qa", async () => {
      console.log("💾 Сохранение последнего вопроса и ответа");

      const lastBotMessages = await db
        .select()
        .from(conversationMessage)
        .where(
          and(
            eq(conversationMessage.conversationId, conversationId),
            eq(conversationMessage.sender, "BOT"),
          ),
        )
        .orderBy(desc(conversationMessage.createdAt))
        .limit(1);

      const lastQuestion = lastBotMessages[0]?.content || "Первый вопрос";

      await saveQuestionAnswer(conversationId, lastQuestion, transcription);
    });

    if (responseId) {
      const scoringResult = await step.run("create-scoring", async () => {
        console.log("📊 Создание скоринга интервью", {
          responseId,
        });

        const updatedContext = await getInterviewContext(conversationId);

        if (!updatedContext) {
          throw new Error("Не удалось получить обновленный контекст");
        }

        const scoring = await createInterviewScoring(updatedContext);

        console.log("✅ Скоринг создан", {
          score: scoring.score,
          detailedScore: scoring.detailedScore,
        });

        await db
          .insert(interviewScoring)
          .values({
            conversationId,
            responseId,
            score: Math.round(scoring.score),
            detailedScore: Math.round(scoring.detailedScore),
            analysis: scoring.analysis,
          })
          .onConflictDoUpdate({
            target: interviewScoring.conversationId,
            set: {
              score: sql`excluded.score`,
              detailedScore: sql`excluded.detailed_score`,
              analysis: sql`excluded.analysis`,
            },
          });

        console.log("✅ Скоринг интервью сохранен в БД");

        return scoring;
      });

      await step.run("finalize-response-status", async () => {
        console.log("🔄 Финализация статуса response", {
          responseId,
          score: scoringResult.score,
          detailedScore: scoringResult.detailedScore,
        });

        const hrSelectionStatus =
          scoringResult.detailedScore >= 70 ? "RECOMMENDED" : "NOT_RECOMMENDED";

        await db
          .update(vacancyResponse)
          .set({
            status: "COMPLETED",
            hrSelectionStatus,
          })
          .where(eq(vacancyResponse.id, responseId));

        console.log("✅ Статус обновлен", {
          status: "COMPLETED",
          hrSelectionStatus,
          detailedScore: scoringResult.detailedScore,
        });
      });

      // Отправляем уведомление о завершении интервью
      await step.run("send-completion-notification", async () => {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, responseId),
          with: {
            vacancy: true,
          },
        });

        if (!response?.vacancy?.workspaceId) {
          console.warn("⚠️ Не удалось получить workspaceId для уведомления");
          return;
        }

        // Отправляем уведомление о завершении интервью
        await inngest.send({
          name: "freelance/notification.send",
          data: {
            workspaceId: response.vacancy.workspaceId,
            vacancyId: response.vacancyId,
            responseId,
            notificationType: "INTERVIEW_COMPLETED",
            candidateName: response.candidateName ?? undefined,
            score: scoringResult.score,
            detailedScore: scoringResult.detailedScore,
            profileUrl: response.platformProfileUrl ?? response.resumeUrl,
          },
        });

        // Если кандидат высокооценённый (85+), отправляем приоритетное уведомление
        if (scoringResult.detailedScore >= 85) {
          await inngest.send({
            name: "freelance/notification.send",
            data: {
              workspaceId: response.vacancy.workspaceId,
              vacancyId: response.vacancyId,
              responseId,
              notificationType: "HIGH_SCORE_CANDIDATE",
              candidateName: response.candidateName ?? undefined,
              score: scoringResult.score,
              detailedScore: scoringResult.detailedScore,
              profileUrl: response.platformProfileUrl ?? response.resumeUrl,
            },
          });
        }

        console.log("✅ Уведомления отправлены", {
          responseId,
          detailedScore: scoringResult.detailedScore,
          isHighScore: scoringResult.detailedScore >= 85,
        });
      });

      await step.run("extract-salary-expectations", async () => {
        console.log("💰 Извлечение зарплатных ожиданий");

        const conv = await db.query.conversation.findFirst({
          where: eq(conversation.id, conversationId),
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
          },
        });

        if (!conv?.messages) {
          console.log("⚠️ История диалога не найдена");
          return;
        }

        const conversationHistory = conv.messages
          .filter((msg) => msg.sender !== "ADMIN")
          .map((msg) => ({
            sender: msg.sender as "CANDIDATE" | "BOT",
            content:
              msg.contentType === "VOICE" && msg.voiceTranscription
                ? msg.voiceTranscription
                : msg.content,
          }));

        const model = getAIModel();
        const factory = new AgentFactory({ model });
        const agent = factory.createSalaryExtraction();

        const result = await agent.execute(
          { conversationHistory },
          {
            candidateName: undefined,
            vacancyTitle: undefined,
            vacancyDescription: undefined,
            conversationHistory,
          },
        );

        if (!result.success || !result.data) {
          console.error("Salary extraction agent failed", {
            error: result.error,
            conversationId,
          });
          return;
        }

        const trimmedSalary = result.data.salaryExpectations.trim();

        if (trimmedSalary) {
          const current = await db.query.vacancyResponse.findFirst({
            where: eq(vacancyResponse.id, responseId),
          });

          await db
            .update(vacancyResponse)
            .set({
              salaryExpectations: trimmedSalary,
            })
            .where(eq(vacancyResponse.id, responseId));

          await logResponseEvent({
            db,
            responseId,
            eventType: "SALARY_UPDATED",
            oldValue: current?.salaryExpectations,
            newValue: trimmedSalary,
          });

          console.log("✅ Зарплатные ожидания сохранены", {
            salaryExpectations: trimmedSalary,
          });
        } else {
          console.log("ℹ️ Зарплатные ожидания не упоминались");
        }
      });
    }

    const chatId = await step.run("get-chat-id", async () => {
      const conv = await db.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
      });

      if (!conv) {
        throw new Error("Conversation не найден");
      }

      const response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, conv.responseId),
      });

      if (!response?.chatId) {
        throw new Error("ChatId не найден в response");
      }

      console.log("📱 Получен chatId для финального сообщения", {
        conversationId,
        chatId: response.chatId,
      });

      return response.chatId;
    });

    await step.run("send-final-message", async () => {
      const conv = await db.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
        with: {
          messages: {
            orderBy: (messages, { asc }) => [asc(messages.createdAt)],
          },
        },
      });

      let candidateName: string | undefined;
      let vacancyTitle: string | undefined;
      let score: number | undefined;
      let detailedScore: number | undefined;
      let resumeLanguage: string | undefined;

      if (conv?.responseId) {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, conv.responseId),
          with: { vacancy: true },
        });
        candidateName = response?.candidateName ?? undefined;
        vacancyTitle = response?.vacancy?.title ?? undefined;
        resumeLanguage = response?.resumeLanguage ?? "ru";

        const scoring = await db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.conversationId, conversationId),
        });
        score = scoring?.score ?? undefined;
        detailedScore = scoring?.detailedScore ?? undefined;
      }

      const conversationHistory =
        conv?.messages
          .filter((msg) => msg.sender !== "ADMIN")
          .map((msg) => ({
            sender: msg.sender as "CANDIDATE" | "BOT",
            content:
              msg.contentType === "VOICE" && msg.voiceTranscription
                ? msg.voiceTranscription
                : msg.content,
            contentType: msg.contentType,
          })) ?? [];

      const model = getAIModel();
      const factory = new AgentFactory({ model });
      const agent = factory.createInterviewCompletion();

      const agentContext = {
        candidateName,
        vacancyTitle,
        vacancyDescription: undefined,
        conversationHistory,
      };

      const result = await agent.execute(
        {
          questionCount: questionNumber,
          score,
          detailedScore,
          resumeLanguage: resumeLanguage || "ru",
        },
        agentContext,
      );

      let finalMessage: string;

      if (!result.success || !result.data) {
        console.error("Interview completion agent failed", {
          error: result.error,
          conversationId,
        });

        finalMessage =
          "Спасибо за беседу! Обработаю информацию и вернусь с обратной связью.";
      } else {
        finalMessage = result.data.finalMessage;
      }

      const [newMessage] = await db
        .insert(conversationMessage)
        .values({
          conversationId,
          sender: "BOT",
          contentType: "TEXT",
          channel: "TELEGRAM",
          content: finalMessage.trim(),
          channel: "TELEGRAM",
        })
        .returning();

      if (!newMessage) {
        throw new Error("Не удалось создать запись сообщения");
      }

      await inngest.send({
        name: "telegram/message.send",
        data: {
          messageId: newMessage.id,
          chatId,
          content: finalMessage.trim(),
        },
      });

      console.log("✅ Финальное сообщение отправлено");
    });

    return {
      success: true,
      conversationId,
      totalQuestions: questionNumber,
    };
  },
);
