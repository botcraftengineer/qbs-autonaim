import { eq } from "@qbs-autonaim/db";
import { funnelComment } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const deleteComment = protectedProcedure
  .input(
    z.object({
      commentId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    await ctx.db
      .delete(funnelComment)
      .where(eq(funnelComment.id, input.commentId));

    return { success: true };
  });
