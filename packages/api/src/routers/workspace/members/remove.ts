import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const remove = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      userId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const isSelfRemoval = input.userId === ctx.session.user.id;

    const targetUserAccess = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      input.userId,
    );

    if (!targetUserAccess) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Пользователь не является участником workspace",
      });
    }

    if (!isSelfRemoval) {
      const access = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!access || (access.role !== "owner" && access.role !== "admin")) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Недостаточно прав для удаления пользователей",
        });
      }
    }

    if (targetUserAccess.role === "owner") {
      const members = await ctx.workspaceRepository.getMembers(
        input.workspaceId,
      );
      const ownerCount = members.filter((m) => m.role === "owner").length;

      if (ownerCount <= 1) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Невозможно удалить последнего владельца workspace. Назначьте другого владельца перед удалением.",
        });
      }
    }

    await ctx.workspaceRepository.removeUser(input.workspaceId, input.userId);
    return { success: true };
  });
