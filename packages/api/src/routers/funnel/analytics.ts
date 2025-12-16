import { eq } from "@qbs-autonaim/db";
import { funnelCandidate } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const analytics = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const candidates = await ctx.db.query.funnelCandidate.findMany({
      where: eq(funnelCandidate.workspaceId, input.workspaceId),
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const newThisWeek = candidates.filter((c) => c.createdAt >= weekAgo).length;

    const byStage = {
      NEW: candidates.filter((c) => c.stage === "NEW").length,
      REVIEW: candidates.filter((c) => c.stage === "REVIEW").length,
      INTERVIEW: candidates.filter((c) => c.stage === "INTERVIEW").length,
      HIRED: candidates.filter((c) => c.stage === "HIRED").length,
      REJECTED: candidates.filter((c) => c.stage === "REJECTED").length,
    };

    const hired = byStage.HIRED;
    const total = candidates.length;
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
