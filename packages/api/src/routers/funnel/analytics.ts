import { eq, inArray } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const analytics = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
      columns: { id: true },
    });

    const workspaceVacancyIds = vacancies.map((v) => v.id);

    const vacancyIds = input.vacancyId
      ? workspaceVacancyIds.includes(input.vacancyId)
        ? [input.vacancyId]
        : []
      : workspaceVacancyIds;

    if (vacancyIds.length === 0) {
      return {
        totalCandidates: 0,
        newThisWeek: 0,
        inReview: 0,
        hired: 0,
        conversionRate: 0,
        byStage: {
          NEW: 0,
          REVIEW: 0,
          INTERVIEW: 0,
          OFFER: 0,
          HIRED: 0,
          REJECTED: 0,
        },
      };
    }

    const responses = await ctx.db.query.vacancyResponse.findMany({
      where: inArray(vacancyResponse.vacancyId, vacancyIds),
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newThisWeek = responses.filter((r) => r.createdAt >= weekAgo).length;

    const byStage = {
      NEW: responses.filter((r) => r.status === "NEW").length,
      REVIEW: responses.filter((r) => r.status === "EVALUATED").length,
      INTERVIEW: responses.filter(
        (r) => r.status === "DIALOG_APPROVED" || r.status === "INTERVIEW_HH",
      ).length,
      OFFER: responses.filter((r) => r.hrSelectionStatus === "OFFER").length,
      HIRED: responses.filter(
        (r) =>
          r.hrSelectionStatus === "INVITE" ||
          r.hrSelectionStatus === "RECOMMENDED",
      ).length,
      REJECTED: responses.filter(
        (r) =>
          r.hrSelectionStatus === "REJECTED" ||
          r.hrSelectionStatus === "NOT_RECOMMENDED" ||
          r.status === "SKIPPED",
      ).length,
    };

    const hired = byStage.HIRED;
    const total = responses.length;
    const conversionRate = total > 0 ? Math.round((hired / total) * 100) : 0;

    return {
      totalCandidates: total,
      newThisWeek,
      inReview: byStage.REVIEW,
      hired,
      conversionRate,
      byStage,
    };
  });
