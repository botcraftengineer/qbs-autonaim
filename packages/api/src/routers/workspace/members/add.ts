import { env } from "@qbs-autonaim/config";
import { workspaceRepository } from "@qbs-autonaim/db";
import { WorkspaceInviteEmail } from "@qbs-autonaim/emails";
import { sendEmail } from "@qbs-autonaim/emails/send";
import { addUserToWorkspaceSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../trpc";

export const addMember = protectedProcedure
  .input(addUserToWorkspaceSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для приглашения пользователей",
      });
    }

    const user = await workspaceRepository.findUserByEmail(input.email);
    const userId = user?.id || null;

    if (userId) {
      const existingMember = await workspaceRepository.checkAccess(
        input.workspaceId,
        userId,
      );

      if (existingMember) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Пользователь уже является участником workspace",
        });
      }
    }

    const existingInvite = await workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (existingInvite) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Приглашение для этого email уже существует",
      });
    }

    const invite = await workspaceRepository.createPersonalInvite(
      input.workspaceId,
      ctx.session.user.id,
      input.email,
      userId,
      input.role,
    );

    const workspace = await workspaceRepository.findById(input.workspaceId);

    if (workspace) {
      const inviteLink = `${env.APP_URL}/invite/${invite.token}`;

      await sendEmail({
        to: [input.email],
        subject: `Приглашение в ${workspace.name}`,
        react: WorkspaceInviteEmail({
          workspaceName: workspace.name,
          workspaceLogo: workspace.logo || undefined,
          inviterName: ctx.session.user.name || ctx.session.user.email,
          inviteLink,
          role: input.role,
        }),
      });
    }

    return invite;
  });
