import { organizationRepository } from "@qbs-autonaim/db";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure.query(async ({ ctx }) => {
  const organizations = await organizationRepository.getUserOrganizations(
    ctx.session.user.id,
  );
  return organizations;
});
