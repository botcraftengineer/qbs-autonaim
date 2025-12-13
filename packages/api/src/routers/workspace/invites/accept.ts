import { workspaceRepository } from "@qbs-autonaim/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const accept = protectedProcedure
  .input(z.object({ token: z.string() }))
  .mutation(async ({ input, ctx }) => {
    const invite = await workspaceRepository.getInviteByToken(input.token);

    if (!invite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    if (new Date(invite.expiresAt) < new Date()) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Срок действия приглашения истек",
      });
    }

    if (invite.invitedUserId && invite.invitedUserId !== ctx.session.user.id) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Это приглашение предназначено для другого пользователя",
      });
    }

    if (
      invite.invitedEmail &&
      (!invite.invitedUserId || invite.invitedUserId !== ctx.session.user.id)
    ) {
      const sessionEmail = ctx.session.user.email?.toLowerCase();
      const invitedEmail = invite.invitedEmail.toLowerCase();

      if (!sessionEmail || sessionEmail !== invitedEmail) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Это приглашение предназначено для другого пользователя",
        });
      }
    }

    const existingMember = await workspaceRepository.checkAccess(
      invite.workspaceId,
      ctx.session.user.id,
    );

    if (existingMember) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вы уже являетесь участником этого workspace",
      });
    }

    await workspaceRepository.addUser(
      invite.workspaceId,
      ctx.session.user.id,
      invite.role,
    );

    await workspaceRepository.deleteInviteByToken(input.token);

    return { success: true, workspace: invite.workspace };
  });
