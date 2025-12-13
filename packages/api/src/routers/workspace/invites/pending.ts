import { workspaceRepository } from "@qbs-autonaim/db";
import { protectedProcedure } from "../../../trpc";

export const getPending = protectedProcedure.query(async ({ ctx }) => {
  const invites = await workspaceRepository.getPendingInvitesByUser(
    ctx.session.user.id,
    ctx.session.user.email,
  );
  return invites;
});
