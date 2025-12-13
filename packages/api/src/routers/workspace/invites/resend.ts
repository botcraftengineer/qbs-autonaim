import { workspaceRepository } from "@qbs-autonaim/db";
import { sendEmail } from "@qbs-autonaim/emails";
import { addUserToWorkspaceSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../trpc";

export const resend = protectedProcedure
  .input(addUserToWorkspaceSchema)
  .mutation(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для отправки приглашений",
      });
    }

    const existingInvite = await workspaceRepository.findInviteByEmail(
      input.workspaceId,
      input.email,
    );

    if (!existingInvite) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Приглашение не найдено",
      });
    }

    const workspace = await workspaceRepository.findById(input.workspaceId);

    if (!workspace) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Workspace не найден",
      });
    }

    const { env } = await import("@qbs-autonaim/config");
    const inviteLink = `${env.APP_URL}/invite/${existingInvite.token}`;

    const { WorkspaceInviteEmail } = await import("@qbs-autonaim/emails");

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

    return { success: true };
  });
