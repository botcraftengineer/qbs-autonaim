import { inngest } from "../../client";
import { FreelancePlatformParser } from "@qbs-autonaim/shared/utils";
import { db } from "@qbs-autonaim/db/client";

/**
 * Синхронизация откликов для gig с фриланс-платформ
 */
export const syncGigResponses = inngest.createFunction(
  {
    id: "sync-gig-responses",
    name: "Sync Gig Responses from Freelance Platforms",
  },
  {
    event: "gig/sync-responses",
  },
  async ({ event, step }) => {
    const { gigId } = event.data;

    // Получаем gig
    const gigRecord = await step.run("get-gig", async () => {
      return await db.query.gigs.findFirst({
        where: (gigs, { eq }) => eq(gigs.id, gigId),
      });
    });

    if (!gigRecord) {
      throw new Error(`Gig ${gigId} not found`);
    }

    // Проверяем, что у gig есть внешняя ссылка
    if (!gigRecord.url || !gigRecord.externalId) {
      return {
        success: false,
        message: "Gig has no external platform link",
        syncedCount: 0,
      };
    }

    // Синхронизируем в зависимости от платформы
    const syncResult = await step.run("sync-platform-responses", async () => {
      switch (gigRecord.source) {
        case "KWORK":
          return await syncKworkResponses(gigRecord.externalId);
        case "FL_RU":
          return await syncFlRuResponses(gigRecord.externalId);
        case "FREELANCE_RU":
          return await syncFreelanceRuResponses(gigRecord.externalId);
        default:
          return {
            success: false,
            message: `Unsupported platform: ${gigRecord.source}`,
            syncedCount: 0,
          };
      }
    });

    return {
      success: syncResult.success,
      message: syncResult.message,
      platform: gigRecord.source,
      externalId: gigRecord.externalId,
      syncedCount: syncResult.syncedCount,
    };
  },
);

/**
 * Синхронизация откликов с KWork
 */
async function syncKworkResponses(externalId: string) {
  // TODO: Реализовать API интеграцию с KWork
  // Пока возвращаем заглушку
  console.log(`[sync-gig-responses] Syncing KWork responses for project ${externalId}`);

  return {
    success: true,
    message: "KWork sync completed (stub)",
    syncedCount: 0,
  };
}

/**
 * Синхронизация откликов с FL.ru
 */
async function syncFlRuResponses(externalId: string) {
  // TODO: Реализовать API интеграцию с FL.ru
  console.log(`[sync-gig-responses] Syncing FL.ru responses for project ${externalId}`);

  return {
    success: true,
    message: "FL.ru sync completed (stub)",
    syncedCount: 0,
  };
}

/**
 * Синхронизация откликов с Freelance.ru
 */
async function syncFreelanceRuResponses(externalId: string) {
  // TODO: Реализовать API интеграцию с Freelance.ru
  console.log(`[sync-gig-responses] Syncing Freelance.ru responses for project ${externalId}`);

  return {
    success: true,
    message: "Freelance.ru sync completed (stub)",
    syncedCount: 0,
  };
}