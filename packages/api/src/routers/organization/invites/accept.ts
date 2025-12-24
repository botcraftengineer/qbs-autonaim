import {
  type OrganizationMember,
  organizationRepository,
} from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const acceptInvite = protectedProcedure
  .input(
    z.object({
      token: z.string().min(1, "Токен обязателен"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Получение приглашения по токену
    const invite = await organizationRepository.getInviteByToken(input.token);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    // Проверка срока действия
    if (invite.expiresAt < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Срок действия приглашения истек",
      });
    }

    // Получение организации
    const organization = await organizationRepository.findById(
      invite.organizationId,
    );

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    // Проверка, не является ли пользователь уже участником
    const existingMember = await organizationRepository.checkAccess(
      invite.organizationId,
      ctx.session.user.id,
    );

    if (existingMember) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Вы уже являетесь участником этой организации",
      });
    }

    // Добавление пользователя в организацию с указанной ролью
    let member: OrganizationMember;
    try {
      member = await organizationRepository.addMember(
        invite.organizationId,
        ctx.session.user.id,
        invite.role,
      );

      // Удаление приглашения только после успешного добавления
      await organizationRepository.deleteInvite(invite.id);
    } catch (error) {
      // Если добавление не удалось, не удаляем приглашение
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось добавить пользователя в организацию",
        cause: error,
      });
    }

    return {
      member,
      organization,
    };
  });
