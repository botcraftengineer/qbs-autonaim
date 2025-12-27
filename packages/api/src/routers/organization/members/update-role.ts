import { organizationIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const updateMemberRole = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      userId: z.string().min(1, "ID пользователя обязателен"),
      role: z.enum(["owner", "admin", "member"]),
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

    // Получаем информацию о целевом участнике
    const targetMember = await ctx.organizationRepository.checkAccess(
      input.organizationId,
      input.userId,
    );

    if (!targetMember) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Участник не найден в организации",
      });
    }

    // Проверка прав:
    // - owner может менять роли всех участников
    // - admin не может менять роли owner'ов
    if (access.role === "admin" && targetMember.role === "owner") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Admin не может изменять роль owner",
      });
    }

    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для изменения ролей",
      });
    }

    // Обновление роли участника (метод сам проверит защиту последнего owner)
    const updatedMember = await ctx.organizationRepository.updateMemberRole(
      input.organizationId,
      input.userId,
      input.role,
    );

    return updatedMember;
  });
