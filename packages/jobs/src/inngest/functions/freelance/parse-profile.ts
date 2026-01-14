import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { response } from "@qbs-autonaim/db/schema";
import {
  formatProfileDataForStorage,
  parseFreelancerProfile,
} from "../../../parsers/profile-parser";
import { inngest } from "../../client";

/**
 * Inngest function for parsing freelance platform profiles
 * Extracts profile data from URLs and stores it in the database
 */
export const parseFreelanceProfileFunction = inngest.createFunction(
  {
    id: "freelance-profile-parse",
    name: "Parse Freelance Profile",
    retries: 3,
    onFailure: async ({ error, event }) => {
      const responseId = (event.data as unknown as { responseId: string })
        .responseId;

      console.error("❌ Все попытки парсинга профиля исчерпаны", {
        responseId,
        error: error.message,
      });
    },
  },
  { event: "freelance/profile.parse" },
  async ({ event, step, attempt }) => {
    const { responseId } = event.data;

    const result = await step.run("parse-freelance-profile", async () => {
      console.log("🎯 Парсинг профиля фрилансера", {
        responseId,
        attempt,
      });

      // Экспоненциальная задержка перед повтором
      if (attempt > 0) {
        const delayMs = 2 ** attempt * 1000; // 2s, 4s, 8s
        console.log(
          `⏳ Задержка перед повтором: ${delayMs}ms (попытка ${attempt + 1}/3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Получаем response с profile URL
      const responseData = await db.query.response.findFirst({
        where: eq(response.id, responseId),
        columns: {
          id: true,
          platformProfileUrl: true,
          candidateName: true,
        },
      });

      if (!responseData) {
        throw new Error(`Отклик ${responseId} не найден`);
      }

      if (!responseData.platformProfileUrl) {
        console.log("⚠️ URL профиля отсутствует, пропускаем парсинг");
        return {
          success: true,
          responseId,
          message: "URL профиля отсутствует",
        };
      }

      try {
        console.log("📊 Парсинг профиля:", responseData.platformProfileUrl);

        // Парсим профиль
        const profileData = await parseFreelancerProfile(
          responseData.platformProfileUrl,
        );

        console.log("✅ Профиль распарсен", {
          platform: profileData.platform,
          username: profileData.username,
          hasError: !!profileData.error,
        });

        // Форматируем данные для сохранения
        const storedProfileData = formatProfileDataForStorage(profileData);

        // Сохраняем в базу данных
        await db
          .update(response)
          .set({
            profileData: storedProfileData,
          })
          .where(eq(response.id, responseId));

        console.log("💾 Данные профиля сохранены в базу", {
          responseId,
          platform: profileData.platform,
          username: profileData.username,
        });

        return {
          success: true,
          responseId,
          profileData: {
            platform: profileData.platform,
            username: profileData.username,
            hasError: !!profileData.error,
          },
        };
      } catch (error) {
        console.error("❌ Ошибка парсинга профиля:", error);

        // Сохраняем информацию об ошибке
        const errorProfileData = formatProfileDataForStorage({
          platform: "unknown",
          username: "",
          profileUrl: responseData.platformProfileUrl,
          parsedAt: new Date(),
          error:
            error instanceof Error ? error.message : "Неизвестная ошибка парсинга",
        });

        await db
          .update(response)
          .set({
            profileData: errorProfileData,
          })
          .where(eq(response.id, responseId));

        throw error;
      }
    });

    return result;
  },
);