import { updateUserRoleSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../trpc";

export const updateRole = protectedProcedure
  .input(updateUserRoleSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || access.role !== "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Только owner может изменять роли",
      });
    }

    const updated = await ctx.workspaceRepository.updateUserRole(
      input.workspaceId,
      input.userId,
      input.role,
    );

    return updated;
  });
