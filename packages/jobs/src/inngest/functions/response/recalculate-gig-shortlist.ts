import { GigShortlistGenerator } from "@qbs-autonaim/shared";
import { inngest } from "../../client";

/**
 * Inngest function for recalculating gig shortlist
 *
 * Validates that ranking data exists and is up-to-date for shortlist generation
 */
export const recalculateGigShortlistFunction = inngest.createFunction(
  {
    id: "recalculate-gig-shortlist",
    name: "Recalculate Gig Shortlist",
    retries: 3,
  },
  { event: "gig/shortlist.recalculate" },
  async ({ event, step }) => {
    const { gigId, workspaceId, triggeredBy } = event.data;

    const result = await step.run("validate-shortlist-data", async () => {
      console.log("🎯 Валидация данных для шортлиста", {
        gigId,
        workspaceId,
        triggeredBy,
      });

      try {
        // Создаем генератор шортлиста
        const generator = new GigShortlistGenerator();

        // Генерируем шортлист с дефолтными настройками для валидации
        const shortlist = await generator.generateShortlist(gigId, {
          minScore: 70,
          maxCandidates: 8,
          includeOnlyHighlyRecommended: false,
          prioritizeBudgetFit: false,
        });

        console.log("📋 Шортлист валидирован", {
          gigId,
          candidatesCount: shortlist.candidates.length,
          totalCandidates: shortlist.totalCandidates,
          generatedAt: shortlist.generatedAt,
        });

        return {
          success: true,
          gigId,
          workspaceId,
          candidatesCount: shortlist.candidates.length,
          totalCandidates: shortlist.totalCandidates,
          generatedAt: shortlist.generatedAt,
        };
      } catch (error) {
        console.error("❌ Ошибка валидации шортлиста", {
          gigId,
          workspaceId,
          error,
        });
        throw error;
      }
    });

    return result;
  },
);