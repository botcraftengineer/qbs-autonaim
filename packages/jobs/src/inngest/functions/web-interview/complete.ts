import {
  and,
  desc,
  eq,
  gigResponse,
  interviewMessage,
  interviewScoring,
  interviewSession,
  sql,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  formatProfileDataForStorage,
  type ProfileData,
  parseFreelancerProfile,
  type StoredProfileData,
} from "../../../parsers/profile-parser";
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
      chatSessionId,
      transcription,
      reason,
      questionNumber,
      responseId,
      gigResponseId,
    } = event.data;

    console.log("🏁 Completing web interview", {
      chatSessionId,
      questionNumber,
      reason,
    });

    // Получаем контекст интервью
    await step.run("get-interview-context", async () => {
      const ctx = await getInterviewContext(chatSessionId);

      if (!ctx) {
        throw new Error(`Interview context not found for ${chatSessionId}`);
      }

      return ctx;
    });

    // Сохраняем последний ответ если есть
    if (transcription && questionNumber) {
      await step.run("save-final-answer", async () => {
        // Получаем последний вопрос от бота
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

        console.log("✅ Final answer saved", {
          chatSessionId,
          questionNumber,
        });
      });

      // Обновляем контекст с последним ответом
      const updatedContext = await step.run("get-updated-context", async () => {
        const ctx = await getInterviewContext(chatSessionId);
        if (!ctx) {
          throw new Error(`Interview context not found for ${chatSessionId}`);
        }
        return ctx;
      });

      // Создаем скоринг
      await step.run("create-scoring", async () => {
        const result = await createInterviewScoring(updatedContext);

        console.log("✅ Scoring created", {
          chatSessionId,
          score: result.score,
          detailedScore: result.detailedScore,
        });

        await db
          .insert(interviewScoring)
          .values({
            interviewSessionId: chatSessionId,
            responseId: responseId ?? undefined,
            gigResponseId: gigResponseId ?? undefined,
            score: result.score,
            detailedScore: result.detailedScore,
            analysis: result.analysis,
          })
          .onConflictDoUpdate({
            target: interviewScoring.interviewSessionId,
            set: {
              score: sql`excluded.score`,
              detailedScore: sql`excluded.detailed_score`,
              analysis: sql`excluded.analysis`,
            },
          });

        return result;
      });

      // Обновляем статус interviewSession
      await step.run("update-interview-session-status", async () => {
        await db
          .update(interviewSession)
          .set({ status: "completed" })
          .where(eq(interviewSession.id, chatSessionId));

        console.log("✅ InterviewSession status updated to completed", {
          chatSessionId,
        });
      });

      // Обновляем статус vacancy_response
      if (responseId) {
        // Парсим профиль фрилансера перед обновлением статуса
        const profileData = await step.run(
          "parse-profile",
          async (): Promise<ProfileData | null> => {
            const response = await db.query.vacancyResponse.findFirst({
              where: eq(vacancyResponse.id, responseId),
            });

            if (!response?.platformProfileUrl) {
              console.log(
                "⚠️ platformProfileUrl отсутствует, пропускаем парсинг профиля",
              );
              return null;
            }

            try {
              const profile = await parseFreelancerProfile(
                response.platformProfileUrl,
              );

              console.log("✅ Профиль распарсен", {
                platform: profile.platform,
                username: profile.username,
                error: profile.error,
              });

              return profile;
            } catch (error) {
              console.error("❌ Ошибка парсинга профиля:", error);
              return null;
            }
          },
        );

        await step.run("update-response-status", async () => {
          const updateData: {
            status: "COMPLETED";
            profileData?: StoredProfileData;
          } = {
            status: "COMPLETED",
          };

          // Сохраняем данные профиля в поле profileData
          if (profileData && !profileData.error) {
            updateData.profileData = formatProfileDataForStorage(profileData);
          }

          await db
            .update(vacancyResponse)
            .set(updateData)
            .where(eq(vacancyResponse.id, responseId));

          console.log("✅ Response status updated to COMPLETED", {
            responseId,
            profileParsed: !!profileData,
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

      // Обновляем статус gig_response
      if (gigResponseId) {
        // Парсим профиль фрилансера перед обновлением статуса
        const gigProfileData = await step.run(
          "parse-gig-profile",
          async (): Promise<ProfileData | null> => {
            const response = await db.query.gigResponse.findFirst({
              where: eq(gigResponse.id, gigResponseId),
            });

            if (!response?.profileUrl) {
              console.log(
                "⚠️ profileUrl отсутствует, пропускаем парсинг профиля",
              );
              return null;
            }

            try {
              const profile = await parseFreelancerProfile(response.profileUrl);

              console.log("✅ Профиль gig распарсен", {
                platform: profile.platform,
                username: profile.username,
                error: profile.error,
              });

              return profile;
            } catch (error) {
              console.error("❌ Ошибка парсинга профиля gig:", error);
              return null;
            }
          },
        );

        await step.run("update-gig-response-status", async () => {
          const updateData: {
            status: "INTERVIEW";
            updatedAt: Date;
            profileData?: StoredProfileData;
          } = {
            status: "INTERVIEW",
            updatedAt: new Date(),
          };

          // Сохраняем данные профиля в поле profileData
          if (gigProfileData && !gigProfileData.error) {
            updateData.profileData =
              formatProfileDataForStorage(gigProfileData);
          }

          await db
            .update(gigResponse)
            .set(updateData)
            .where(eq(gigResponse.id, gigResponseId));

          console.log("✅ Gig response status updated to INTERVIEW", {
            gigResponseId,
            profileParsed: !!gigProfileData,
          });
        });

        // Отправляем уведомления для gig
        await step.run("send-gig-notifications", async () => {
          const response = await db.query.gigResponse.findFirst({
            where: eq(gigResponse.id, gigResponseId),
            with: {
              gig: true,
            },
          });

          if (!response?.gig?.workspaceId) {
            console.warn(
              "⚠️ Не удалось получить workspaceId для уведомления gig",
            );
            return;
          }

          // Получаем скоринг
          const scoring = await db.query.interviewScoring.findFirst({
            where: eq(interviewScoring.gigResponseId, gigResponseId),
          });

          if (!scoring) {
            console.warn("⚠️ Скоринг не найден для уведомления gig");
            return;
          }

          // Отправляем уведомление о завершении интервью
          await inngest.send({
            name: "freelance/notification.send",
            data: {
              workspaceId: response.gig.workspaceId,
              gigId: response.gigId,
              gigResponseId,
              notificationType: "INTERVIEW_COMPLETED",
              candidateName: response.candidateName ?? undefined,
              score: scoring.score,
              detailedScore: scoring.detailedScore,
              profileUrl: response.profileUrl ?? undefined,
            },
          });

          // Если кандидат высокооценённый (85+), отправляем приоритетное уведомление
          if (scoring.detailedScore >= 85) {
            await inngest.send({
              name: "freelance/notification.send",
              data: {
                workspaceId: response.gig.workspaceId,
                gigId: response.gigId,
                gigResponseId,
                notificationType: "HIGH_SCORE_CANDIDATE",
                candidateName: response.candidateName ?? undefined,
                score: scoring.score,
                detailedScore: scoring.detailedScore,
                profileUrl: response.profileUrl ?? undefined,
              },
            });
          }

          console.log("✅ Уведомления для gig отправлены", {
            gigResponseId,
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

      // Получаем interviewSession для доступа к lastChannel
      const session = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, chatSessionId),
      });

      if (!session) {
        throw new Error(`InterviewSession ${chatSessionId} not found`);
      }

      await db.insert(interviewMessage).values({
        sessionId: chatSessionId,
        role: "assistant",
        type: "text",
        channel: session.lastChannel ?? "web",
        content: completionMessage,
      });

      console.log("✅ Completion message sent", {
        chatSessionId,
      });
    });

    console.log("✅ Web interview completed", {
      chatSessionId,
      questionNumber,
    });

    return {
      success: true,
      chatSessionId,
    };
  },
);
