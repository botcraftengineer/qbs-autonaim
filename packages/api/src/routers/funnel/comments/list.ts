import { eq } from "@qbs-autonaim/db";
import { funnelComment } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      candidateId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const comments = await ctx.db.query.funnelComment.findMany({
      where: eq(funnelComment.candidateId, input.candidateId),
      orderBy: (comments, { desc }) => [desc(comments.createdAt)],
    });

    return comments;
  });
