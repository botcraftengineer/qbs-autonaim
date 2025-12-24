
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listInvites = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
    }),
  )
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

    // Проверка прав (только owner/admin могут просматривать приглашения)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для просмотра приглашений",
      });
    }

    // Получение только активных приглашений
    const invites = await ctx.organizationRepository.getPendingInvites(
      input.organizationId,
    );

    return invites;
  });
