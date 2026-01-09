import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  formatProfileDataForStorage,
  type ProfileData,
  parseFreelancerProfile,
} from "../../../parsers/profile-parser";
import {
  createInterviewScoring,
  getInterviewContext,
} from "../../../services/interview";
import { inngest } from "../../client";

/**
 * Функция оценки отклика на гиг на основе диалога
 * Анализирует диалог и создает скоринг
 */
export const evaluateGigResponseFunction = inngest.createFunction(
  {
    id: "gig-response-evaluate",
    name: "Evaluate Gig Response",
    retries: 3,
  },
  { event: "gig/response.evaluate" },
  async ({ event, step }) => {
    const { responseId, workspaceId, conversationId } = event.data;

    console.log("🎯 Evaluating gig response", {
      responseId,
      workspaceId,
      conversationId,
    });

    // Получаем отклик для доступа к profileUrl
    const response = await step.run("get-response", async () => {
      const { gigResponse } = await import("@qbs-autonaim/db/schema");
      const resp = await db.query.gigResponse.findFirst({
        where: eq(gigResponse.id, responseId),
      });

      if (!resp) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      return resp;
    });

    // Парсим профиль фрилансера (если есть profileUrl)
    const profileData = await step.run(
      "parse-profile",
      async (): Promise<ProfileData | null> => {
        if (!response.profileUrl) {
          console.log("⚠️ ProfileUrl отсутствует, пропускаем парсинг профиля");
          return null;
        }

        try {
          const profile = await parseFreelancerProfile(response.profileUrl);

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

    const context = await step.run("get-interview-context", async () => {
      const ctx = await getInterviewContext(conversationId);

      if (!ctx) {
        throw new Error(
          `Контекст интервью не найден для conversation ${conversationId}`,
        );
      }

      return ctx;
    });

    const scoring = await step.run("create-scoring", async () => {
      const result = await createInterviewScoring(context);

      console.log("✅ Скоринг создан", {
        conversationId,
        responseId,
        score: result.score,
        detailedScore: result.detailedScore,
      });

      return result;
    });

    await step.run("update-response-status", async () => {
      const { gigResponse } = await import("@qbs-autonaim/db/schema");

      const updateData: {
        status: "EVALUATED";
        updatedAt: Date;
        experience?: string;
      } = {
        status: "EVALUATED",
        updatedAt: new Date(),
      };

      // Сохраняем данные профиля в поле experience
      if (profileData && !profileData.error) {
        updateData.experience = formatProfileDataForStorage(profileData);
      }

      await db
        .update(gigResponse)
        .set(updateData)
        .where(eq(gigResponse.id, responseId));

      console.log("✅ Статус отклика обновлен", {
        responseId,
        status: "EVALUATED",
        profileParsed: !!profileData,
      });
    });

    return {
      success: true,
      conversationId,
      responseId,
      scoring: {
        score: scoring.score,
        detailedScore: scoring.detailedScore,
      },
    };
  },
);
