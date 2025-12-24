
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const accept = protectedProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const invite = await ctx.workspaceRepository.getInviteByToken(input.token);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    // Проверка срока действия
    if (new Date(invite.expiresAt) < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Срок действия приглашения истек",
      });
    }

    // Проверка: приглашение для конкретного пользователя по ID
    if (invite.invitedUserId && invite.invitedUserId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Это приглашение предназначено для другого пользователя",
      });
    }

    // Проверка: приглашение для конкретного email
    if (invite.invitedEmail) {
      const sessionEmail = ctx.session.user.email?.toLowerCase();
      const invitedEmail = invite.invitedEmail.toLowerCase();

      if (!sessionEmail) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "У вашего аккаунта не указан email",
        });
      }

      if (sessionEmail !== invitedEmail) {
        // Логируем для отладки на сервере, но не раскрываем email пользователю
        console.warn(
          `Invite email mismatch: session=${sessionEmail}, invited=${invitedEmail}`,
        );
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Это приглашение не предназначено для вашей учётной записи",
        });
      }
    }

    // Проверка: пользователь уже является участником
    const existingMember = await ctx.workspaceRepository.checkAccess(
      invite.workspaceId,
      ctx.session.user.id,
    );

    if (existingMember) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вы уже являетесь участником этого рабочего пространства",
      });
    }

    // Добавляем пользователя в workspace
    await ctx.workspaceRepository.addUser(
      invite.workspaceId,
      ctx.session.user.id,
      invite.role,
    );

    // Удаляем использованное приглашение
    await ctx.workspaceRepository.deleteInviteByToken(input.token);

    return { success: true, workspace: invite.workspace };
  });
