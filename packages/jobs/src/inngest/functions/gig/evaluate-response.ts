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
  type InterviewScoringResult,
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
    const responseData = await step.run("get-response", async () => {
      const { response } = await import("@qbs-autonaim/db/schema");
      const resp = await db.query.response.findFirst({
        where: eq(response.id, responseId),
      });

      if (!resp) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      // Получаем gig отдельно через entityId
      const gig = await db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, resp.entityId),
      });

      if (!gig) {
        throw new Error(`Gig не найден для отклика: ${responseId}`);
      }

      // Проверяем, что отклик принадлежит указанному workspace
      if (gig.workspaceId !== workspaceId) {
        throw new Error(
          `Отклик ${responseId} не принадлежит workspace ${workspaceId}`,
        );
      }

      return { ...resp, gig };
    });

    // Парсим профиль фрилансера (если есть profileUrl)
    const profileData = await step.run(
      "parse-profile",
      async (): Promise<ProfileData | null> => {
        if (!responseData.profileUrl) {
          console.log("⚠️ ProfileUrl отсутствует, пропускаем парсинг профиля");
          return null;
        }

        try {
          const profile = await parseFreelancerProfile(responseData.profileUrl);

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

    const scoring = await step.run(
      "create-scoring",
      async (): Promise<InterviewScoringResult> => {
        const result = await createInterviewScoring(context);

        console.log("✅ Скоринг создан", {
          chatSessionId,
          responseId,
          score: result.score,
        });

        return result;
      },
    );

    await step.run("save-interview-scoring", async () => {
      const { interviewScoring } = await import("@qbs-autonaim/db/schema");

      await db.insert(interviewScoring).values({
        interviewSessionId: chatSessionId,
        responseId: responseId,
        score: scoring.detailedScore,
        rating: scoring.score,
        analysis: scoring.analysis,
      });

      console.log("✅ Результаты интервью сохранены", {
        chatSessionId,
        responseId,
        score: scoring.score,
      });
    });

    // Обновляем compositeScore в response для работы шортлиста
    await step.run("update-response-composite-score", async () => {
      const { response } = await import("@qbs-autonaim/db/schema");

      await db
        .update(response)
        .set({
          compositeScore: scoring.detailedScore, // 0-100 шкала для шортлиста
        })
        .where(eq(response.id, responseId));

      console.log("✅ Composite score обновлен в response", {
        responseId,
        compositeScore: scoring.detailedScore,
      });
    });

    await step.run("update-response-status", async () => {
      const { response } = await import("@qbs-autonaim/db/schema");

      const updateData: {
        status: "EVALUATED";
        profileData?: StoredProfileData;
      } = {
        status: "EVALUATED",
      };

      // Сохраняем данные профиля в поле profileData
      if (profileData && !profileData.error) {
        updateData.profileData = formatProfileDataForStorage(profileData);
      }

      await db
        .update(response)
        .set({
          status: updateData.status,
          profileData: updateData.profileData as
            | Record<string, unknown>
            | undefined,
        })
        .where(eq(response.id, responseId));

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
      },
    };
  },
);
