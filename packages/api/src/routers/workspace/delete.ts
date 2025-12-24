
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const deleteWorkspace = protectedProcedure
  .input(z.object({ id: workspaceIdSchema }))
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.id,
      ctx.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только owner может удалить workspace",
      });
    }

    await ctx.workspaceRepository.delete(input.id);
    return { success: true };
  });
