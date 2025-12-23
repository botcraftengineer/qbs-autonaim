import { organizationRepository } from "@qbs-autonaim/db";
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

    // Добавление пользователя в организацию с указанной ролью
    const member = await organizationRepository.addMember(
      invite.organizationId,
      ctx.session.user.id,
      invite.role,
    );

    // Удаление приглашения после принятия
    await organizationRepository.deleteInvite(invite.id);

    return {
      member,
      organization,
    };
  });
