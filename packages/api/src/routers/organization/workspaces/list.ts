
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listWorkspaces = protectedProcedure
  .input(z.object({ organizationId: organizationIdSchema }))
  .query(async ({ input, ctx }) => {
    // Проверка доступа к организации
    const access = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Получение всех workspaces организации
    const workspaces = await ctx.organizationRepository.getWorkspaces(
      input.organizationId,
    );

    return workspaces;
  });
