import { AgentFactory } from "@qbs-autonaim/ai";
import {
  and,
  chatMessage,
  chatSession,
  desc,
  eq,
  interviewScoring,
  sql,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getAIModel, logResponseEvent } from "@qbs-autonaim/lib";
import {
  formatProfileDataForStorage,
  parseFreelancerProfile,
  type StoredProfileData,
} from "../../../../parsers/profile-parser";
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
    const { chatSessionId, transcription, questionNumber, responseId } =
      event.data;

    await step.run("save-last-qa", async () => {
      const lastBotMessages = await db
        .select()
        .from(chatMessage)
        .where(
          and(
            eq(chatMessage.sessionId, chatSessionId),
            eq(chatMessage.role, "assistant"),
          ),
        )
        .orderBy(desc(chatMessage.createdAt))
        .limit(1);

      const lastQuestion = lastBotMessages[0]?.content || "Первый вопрос";

      await saveQuestionAnswer(chatSessionId, lastQuestion, transcription);
    });

    if (responseId) {
      const scoringResult = await step.run("create-scoring", async () => {
        const updatedContext = await getInterviewContext(chatSessionId);

        if (!updatedContext) {
          throw new Error("Не удалось получить обновленный контекст");
        }

        const scoring = await createInterviewScoring(updatedContext);

        await db
          .insert(interviewScoring)
          .values({
            chatSessionId,
            responseId,
            score: Math.round(scoring.score),
            detailedScore: Math.round(scoring.detailedScore),
            analysis: scoring.analysis,
          })
          .onConflictDoUpdate({
            target: interviewScoring.chatSessionId,
            set: {
              score: sql`excluded.score`,
              detailedScore: sql`excluded.detailed_score`,
              analysis: sql`excluded.analysis`,
            },
          });

        return scoring;
      });

      await step.run("finalize-response-status", async () => {
        const hrSelectionStatus =
          scoringResult.detailedScore >= 70 ? "RECOMMENDED" : "NOT_RECOMMENDED";

        // Парсим профиль фрилансера перед финализацией
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, responseId),
        });

        const updateData: {
          status: "COMPLETED";
          hrSelectionStatus: "RECOMMENDED" | "NOT_RECOMMENDED";
          profileData?: StoredProfileData;
        } = {
          status: "COMPLETED",
          hrSelectionStatus,
        };

        // Парсим профиль если есть platformProfileUrl
        if (response?.platformProfileUrl) {
          try {
            const profile = await parseFreelancerProfile(
              response.platformProfileUrl,
            );

            console.log("✅ Профиль распарсен (Telegram)", {
              platform: profile.platform,
              username: profile.username,
              error: profile.error,
            });

            if (!profile.error) {
              updateData.profileData = formatProfileDataForStorage(profile);
            }
          } catch (error) {
            console.error("❌ Ошибка парсинга профиля (Telegram):", error);
          }
        }

        await db
          .update(vacancyResponse)
          .set(updateData)
          .where(eq(vacancyResponse.id, responseId));
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
      });

      await step.run("extract-salary-expectations", async () => {
        const session = await db.query.chatSession.findFirst({
          where: eq(chatSession.id, chatSessionId),
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
          },
        });

        if (!session?.messages) {
          return;
        }

        const conversationHistory = session.messages
          .filter((msg) => msg.role !== "admin")
          .map((msg) => ({
            sender: msg.role as "user" | "assistant",
            content:
              msg.type === "voice" && msg.voiceTranscription
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
            chatSessionId,
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
        }
      });
    }

    const chatId = await step.run("get-chat-id", async () => {
      const session = await db.query.chatSession.findFirst({
        where: eq(chatSession.id, chatSessionId),
      });

      if (!session) {
        throw new Error("ChatSession не найден");
      }

      if (session.entityType !== "vacancy_response") {
        throw new Error("ChatSession не связан с vacancy_response");
      }

      const response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, session.entityId),
      });

      if (!response?.chatId) {
        throw new Error("ChatId не найден в response");
      }

      return response.chatId;
    });

    await step.run("send-final-message", async () => {
      const session = await db.query.chatSession.findFirst({
        where: eq(chatSession.id, chatSessionId),
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

      if (session?.entityType === "vacancy_response") {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, session.entityId),
          with: { vacancy: true },
        });
        candidateName = response?.candidateName ?? undefined;
        vacancyTitle = response?.vacancy?.title ?? undefined;
        resumeLanguage = response?.resumeLanguage ?? "ru";

        const scoring = await db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.chatSessionId, chatSessionId),
        });
        score = scoring?.score ?? undefined;
        detailedScore = scoring?.detailedScore ?? undefined;
      }

      const conversationHistory =
        session?.messages
          .filter((msg) => msg.role !== "admin")
          .map((msg) => ({
            sender: msg.role as "user" | "assistant",
            content:
              msg.type === "voice" && msg.voiceTranscription
                ? msg.voiceTranscription
                : msg.content,
            contentType: msg.type,
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
          chatSessionId,
        });

        finalMessage =
          "Спасибо за беседу! Обработаю информацию и вернусь с обратной связью.";
      } else {
        finalMessage = result.data.finalMessage;
      }

      const [newMessage] = await db
        .insert(chatMessage)
        .values({
          sessionId: chatSessionId,
          role: "assistant",
          type: "text",
          content: finalMessage.trim(),
          channel: "telegram",
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
    });

    return {
      success: true,
      chatSessionId,
      totalQuestions: questionNumber,
    };
  },
);
