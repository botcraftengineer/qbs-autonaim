import { AgentFactory } from "@qbs-autonaim/ai";
import { and, desc, eq, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  interviewScoring,
  interviewSession,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
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
        .from(interviewMessage)
        .where(
          and(
            eq(interviewMessage.sessionId, chatSessionId),
            eq(interviewMessage.role, "assistant"),
          ),
        )
        .orderBy(desc(interviewMessage.createdAt))
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
            interviewSessionId: chatSessionId,
            responseId,
            score: Math.round(scoring.score),
            analysis: scoring.analysis,
          })
          .onConflictDoUpdate({
            target: interviewScoring.interviewSessionId,
            set: {
              score: sql`excluded.score`,
              analysis: sql`excluded.analysis`,
            },
          });

        return scoring;
      });

      await step.run("finalize-response-status", async () => {
        const hrSelectionStatus =
          scoringResult.detailedScore >= 70 ? "RECOMMENDED" : "NOT_RECOMMENDED";

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

        if (response?.platformProfileUrl) {
          try {
            const profile = await parseFreelancerProfile(
              response.platformProfileUrl,
            );

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

      await step.run("send-completion-notification", async () => {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, responseId),
          with: { vacancy: true },
        });

        if (!response?.vacancy?.workspaceId) return;

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
        const session = await db.query.interviewSession.findFirst({
          where: eq(interviewSession.id, chatSessionId),
          with: {
            messages: {
              orderBy: (messages, { asc }) => [asc(messages.createdAt)],
            },
          },
        });

        if (!session?.messages) return;

        const conversationHistory = session.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
              | "CANDIDATE"
              | "BOT",
            content:
              msg.type === "voice" && msg.voiceTranscription
                ? msg.voiceTranscription
                : (msg.content ?? ""),
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

        if (!result.success || !result.data) return;

        const trimmedSalary = result.data.salaryExpectations.trim();

        if (trimmedSalary) {
          const current = await db.query.vacancyResponse.findFirst({
            where: eq(vacancyResponse.id, responseId),
          });

          await db
            .update(vacancyResponse)
            .set({ salaryExpectationsComment: trimmedSalary })
            .where(eq(vacancyResponse.id, responseId));

          await logResponseEvent({
            db,
            responseId,
            eventType: "SALARY_UPDATED",
            oldValue: current?.salaryExpectationsComment,
            newValue: trimmedSalary,
          });
        }
      });
    }

    const chatId = await step.run("get-chat-id", async () => {
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
      });

      if (!session) throw new Error("InterviewSession не найден");

      if (
        session.entityType === "vacancy_response" &&
        session.vacancyResponseId
      ) {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, session.vacancyResponseId),
        });
        if (!response?.chatId) throw new Error("ChatId не найден в response");
        return response.chatId;
      }

      throw new Error("Не удалось получить chatId");
    });

    await step.run("send-final-message", async () => {
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
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

      if (session?.vacancyResponseId) {
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, session.vacancyResponseId),
          with: { vacancy: true },
        });
        candidateName = response?.candidateName ?? undefined;
        vacancyTitle = response?.vacancy?.title ?? undefined;
        resumeLanguage = response?.resumeLanguage ?? "ru";

        const scoring = await db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.interviewSessionId, chatSessionId),
        });
        score = scoring?.score ?? undefined;
      }

      const conversationHistory =
        session?.messages
          .filter((msg) => msg.role !== "system")
          .map((msg) => ({
            sender: (msg.role === "user" ? "CANDIDATE" : "BOT") as
              | "CANDIDATE"
              | "BOT",
            content:
              msg.type === "voice" && msg.voiceTranscription
                ? msg.voiceTranscription
                : (msg.content ?? ""),
            contentType: msg.type,
          })) ?? [];

      const model = getAIModel();
      const factory = new AgentFactory({ model });
      const agent = factory.createInterviewCompletion();

      const result = await agent.execute(
        {
          questionCount: questionNumber,
          score,
          detailedScore,
          resumeLanguage: resumeLanguage || "ru",
        },
        {
          candidateName,
          vacancyTitle,
          vacancyDescription: undefined,
          conversationHistory,
        },
      );

      const finalMessage =
        result.success && result.data
          ? result.data.finalMessage
          : "Спасибо за беседу! Обработаю информацию и вернусь с обратной связью.";

      const [newMessage] = await db
        .insert(interviewMessage)
        .values({
          sessionId: chatSessionId,
          role: "assistant",
          type: "text",
          content: finalMessage.trim(),
          channel: "telegram",
        })
        .returning();

      if (!newMessage) throw new Error("Не удалось создать запись сообщения");

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
