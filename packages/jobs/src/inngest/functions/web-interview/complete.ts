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
import {
  createInterviewScoring,
  getInterviewContext,
  saveQuestionAnswer,
} from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция завершения интервью в веб-чате
 * Создает скоринг и обновляет статус
 */
export const webCompleteInterviewFunction = inngest.createFunction(
  {
    id: "web-interview-complete",
    name: "Web Interview Complete",
    retries: 3,
  },
  { event: "web/interview.complete" },
  async ({ event, step }) => {
    const {
      conversationId,
      transcription,
      reason,
      questionNumber,
      responseId,
    } = event.data;

    console.log("🏁 Completing web interview", {
      conversationId,
      questionNumber,
      reason,
    });

    // Получаем контекст интервью
    await step.run("get-interview-context", async () => {
      const ctx = await getInterviewContext(conversationId);

      if (!ctx) {
        throw new Error(`Interview context not found for ${conversationId}`);
      }

      return ctx;
    });

    // Сохраняем последний ответ если есть
    if (transcription && questionNumber) {
      await step.run("save-final-answer", async () => {
        // Получаем последний вопрос от бота
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

        console.log("✅ Final answer saved", {
          conversationId,
          questionNumber,
        });
      });

      // Обновляем контекст с последним ответом
      const updatedContext = await step.run("get-updated-context", async () => {
        const ctx = await getInterviewContext(conversationId);
        if (!ctx) {
          throw new Error(`Interview context not found for ${conversationId}`);
        }
        return ctx;
      });

      // Создаем скоринг
      await step.run("create-scoring", async () => {
        const result = await createInterviewScoring(updatedContext);

        console.log("✅ Scoring created", {
          conversationId,
          score: result.score,
          detailedScore: result.detailedScore,
        });

        await db
          .insert(interviewScoring)
          .values({
            conversationId,
            responseId: responseId ?? undefined,
            score: result.score,
            detailedScore: result.detailedScore,
            analysis: result.analysis,
          })
          .onConflictDoUpdate({
            target: interviewScoring.conversationId,
            set: {
              score: sql`excluded.score`,
              detailedScore: sql`excluded.detailed_score`,
              analysis: sql`excluded.analysis`,
            },
          });

        return result;
      });

      // Обновляем статус conversation
      await step.run("update-conversation-status", async () => {
        await db
          .update(conversation)
          .set({ status: "COMPLETED" })
          .where(eq(conversation.id, conversationId));

        console.log("✅ Conversation status updated to COMPLETED", {
          conversationId,
        });
      });

      // Обновляем статус vacancy_response
      if (responseId) {
        await step.run("update-response-status", async () => {
          await db
            .update(vacancyResponse)
            .set({
              status: "COMPLETED",
            })
            .where(eq(vacancyResponse.id, responseId));

          console.log("✅ Response status updated to COMPLETED", {
            responseId,
          });
        });

        // Отправляем уведомления
        await step.run("send-notifications", async () => {
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

          // Получаем скоринг
          const scoring = await db.query.interviewScoring.findFirst({
            where: eq(interviewScoring.responseId, responseId),
          });

          if (!scoring) {
            console.warn("⚠️ Скоринг не найден для уведомления");
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
              score: scoring.score,
              detailedScore: scoring.detailedScore,
              profileUrl: response.platformProfileUrl ?? response.resumeUrl,
            },
          });

          // Если кандидат высокооценённый (85+), отправляем приоритетное уведомление
          if (scoring.detailedScore >= 85) {
            await inngest.send({
              name: "freelance/notification.send",
              data: {
                workspaceId: response.vacancy.workspaceId,
                vacancyId: response.vacancyId,
                responseId,
                notificationType: "HIGH_SCORE_CANDIDATE",
                candidateName: response.candidateName ?? undefined,
                score: scoring.score,
                detailedScore: scoring.detailedScore,
                profileUrl: response.platformProfileUrl ?? response.resumeUrl,
              },
            });
          }

          console.log("✅ Уведомления отправлены", {
            responseId,
            detailedScore: scoring.detailedScore,
            isHighScore: scoring.detailedScore >= 85,
          });
        });
      }
    }

    // Отправляем финальное сообщение
    await step.run("send-completion-message", async () => {
      const completionMessage =
        reason ||
        "Спасибо за ваши ответы! Интервью завершено. Мы свяжемся с вами в ближайшее время.";

      // Получаем conversation для доступа к source
      const conv = await db.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
      });

      if (!conv) {
        throw new Error(`Conversation ${conversationId} not found`);
      }

      await db.insert(conversationMessage).values({
        conversationId,
        sender: "BOT",
        contentType: "TEXT",
        channel: conv.source,
        content: completionMessage,
      });

      console.log("✅ Completion message sent", {
        conversationId,
      });
    });

    console.log("✅ Web interview completed", {
      conversationId,
      questionNumber,
    });

    return {
      success: true,
      conversationId,
    };
  },
);
