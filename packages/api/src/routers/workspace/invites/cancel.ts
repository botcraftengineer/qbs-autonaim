
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const cancel = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      email: z.string().email(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отмены приглашений",
      });
    }

    const invite = await ctx.workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    await ctx.workspaceRepository.cancelInviteByEmail(
      input.workspaceId,
      input.email,
    );

    return { success: true };
  });
