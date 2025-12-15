import { and, eq } from "@qbs-autonaim/db";
import { funnelCandidate } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const where = input.vacancyId
      ? and(
          eq(funnelCandidate.workspaceId, input.workspaceId),
          eq(funnelCandidate.vacancyId, input.vacancyId),
        )
      : eq(funnelCandidate.workspaceId, input.workspaceId);

    const candidates = await ctx.db.query.funnelCandidate.findMany({
      where,
      orderBy: (candidates, { desc }) => [desc(candidates.createdAt)],
    });

    return candidates;
  });
