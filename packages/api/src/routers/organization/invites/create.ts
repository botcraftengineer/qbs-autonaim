import { APP_CONFIG } from "@qbs-autonaim/config";
import { organizationRepository } from "@qbs-autonaim/db";
import { OrganizationInviteEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import {
  inviteToOrganizationSchema,
  organizationIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const createInvite = protectedProcedure
  .input(
    z.object({
      organizationId: organizationIdSchema,
      email: inviteToOrganizationSchema.shape.email,
      role: inviteToOrganizationSchema.shape.role,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Проверка доступа к организации
    const access = await organizationRepository.checkAccess(
      input.organizationId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к организации",
      });
    }

    // Проверка прав (только owner/admin могут приглашать)
    if (access.role !== "owner" && access.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для приглашения участников",
      });
    }

    // Установка срока действия приглашения (7 дней)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Создание приглашения
    const invite = await organizationRepository.createInvite({
      organizationId: input.organizationId,
      invitedEmail: input.email,
      role: input.role,
      createdBy: ctx.session.user.id,
      expiresAt,
    });

    // Получаем данные организации для email
    const organization = await organizationRepository.findById(
      input.organizationId,
    );

    if (!organization) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Организация не найдена",
      });
    }

    // Отправка email уведомления (requirement 8.3)
    try {
      const inviteLink = `${APP_CONFIG.url}/invites/${invite.token}/accept`;

      await sendEmail({
        to: [input.email],
        subject: `Приглашение в организацию ${organization.name}`,
        react: OrganizationInviteEmail({
          organizationName: organization.name,
          organizationLogo: organization.logo ?? undefined,
          inviterName: ctx.session.user.name ?? "Пользователь",
          inviteLink,
          role: input.role,
        }),
      });
    } catch (error) {
      // Логируем ошибку отправки email, но не прерываем процесс
      console.error("Ошибка отправки email приглашения:", error);
      // Приглашение уже создано, пользователь может использовать токен напрямую
    }

    return invite;
  });
