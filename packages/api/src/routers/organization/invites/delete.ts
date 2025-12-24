
import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const deleteInvite = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      inviteId: z.string().min(1, "ID приглашения обязателен"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
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

    // Проверка прав (только owner/admin могут отменять приглашения)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отмены приглашений",
      });
    }

    // Загрузка приглашения
    const invite = await ctx.organizationRepository.getInviteById(input.inviteId);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    // Проверка принадлежности приглашения к организации
    if (invite.organizationId !== input.organizationId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Отмена приглашения
    await ctx.organizationRepository.deleteInvite(input.inviteId);

    return { success: true };
  });
