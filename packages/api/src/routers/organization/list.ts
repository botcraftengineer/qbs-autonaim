import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure.query(async ({ ctx }) => {
  const organizations = await ctx.organizationRepository.getUserOrganizations(
    ctx.session.user.id,
  );
  return organizations;
});
