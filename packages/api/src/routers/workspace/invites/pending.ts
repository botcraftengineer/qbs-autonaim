import { protectedProcedure } from "../../../trpc";

export const pending = protectedProcedure.query(async ({ ctx }) => {
  const invites = await ctx.workspaceRepository.getPendingInvitesByUser(
    ctx.session.user.id,
    ctx.session.user.email,
  );
  return invites;
});
