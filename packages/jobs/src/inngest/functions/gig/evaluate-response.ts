import { eq } from "@qbs-autonaim/db";
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
    const { responseId, workspaceId, chatSessionId } = event.data;

    console.log("🎯 Evaluating gig response", {
      responseId,
      workspaceId,
      chatSessionId,
    });

    // Получаем отклик с проверкой принадлежности к workspace
    const response = await step.run("get-response", async () => {
      const { gigResponse } = await import("@qbs-autonaim/db/schema");
      const resp = await db.query.gigResponse.findFirst({
        where: eq(gigResponse.id, responseId),
        with: {
          gig: true,
        },
      });

      if (!resp) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      // Проверяем, что отклик принадлежит указанному workspace
      if (resp.gig.workspaceId !== workspaceId) {
        throw new Error(
          `Отклик ${responseId} не принадлежит workspace ${workspaceId}`,
        );
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
      const ctx = await getInterviewContext(chatSessionId);

      if (!ctx) {
        throw new Error(
          `Контекст интервью не найден для chatSession ${chatSessionId}`,
        );
      }

      return ctx;
    });

    const scoring = await step.run("create-scoring", async () => {
      const result = await createInterviewScoring(context);

      console.log("✅ Скоринг создан", {
        chatSessionId,
        responseId,
        score: result.score,
        detailedScore: result.detailedScore,
      });

      return result;
    });

    await step.run("save-interview-scoring", async () => {
      const { interviewScoring } = await import("@qbs-autonaim/db/schema");

      await db.insert(interviewScoring).values({
        chatSessionId,
        gigResponseId: responseId,
        score: scoring.score,
        detailedScore: scoring.detailedScore,
        analysis: scoring.analysis,
      });

      console.log("✅ Результаты интервью сохранены", {
        chatSessionId,
        responseId,
        score: scoring.score,
        detailedScore: scoring.detailedScore,
      });
    });

    await step.run("update-response-status", async () => {
      const { gigResponse } = await import("@qbs-autonaim/db/schema");

      const updateData: {
        status: "EVALUATED";
        updatedAt: Date;
        profileData?: StoredProfileData;
      } = {
        status: "EVALUATED",
        updatedAt: new Date(),
      };

      // Сохраняем данные профиля в поле profileData
      if (profileData && !profileData.error) {
        updateData.profileData = formatProfileDataForStorage(profileData);
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
      chatSessionId,
      responseId,
      scoring: {
        score: scoring.score,
        detailedScore: scoring.detailedScore,
      },
    };
  },
);
