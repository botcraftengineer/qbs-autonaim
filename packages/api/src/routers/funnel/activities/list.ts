import { eq } from "@qbs-autonaim/db";
import { funnelActivity } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      candidateId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const activities = await ctx.db.query.funnelActivity.findMany({
      where: eq(funnelActivity.candidateId, input.candidateId),
      orderBy: (activities, { desc }) => [desc(activities.createdAt)],
    });

    return activities;
  });
