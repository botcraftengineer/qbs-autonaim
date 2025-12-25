import { eq } from "@qbs-autonaim/db";
import {
  account,
  organization,
  user,
  workspace,
} from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../trpc";

export const me = protectedProcedure.query(async ({ ctx }) => {
  const userData = await ctx.db.query.user.findFirst({
    where: eq(user.id, ctx.session.user.id),
  });

  if (!userData) return null;

  const accounts = await ctx.db.query.account.findMany({
    where: eq(account.userId, ctx.session.user.id),
    columns: {
      id: true,
      providerId: true,
    },
  });

  // Получаем последнюю активную организацию и воркспейс
  let lastActiveOrganization = null;
  let lastActiveWorkspace = null;

  if (userData.lastActiveOrganizationId) {
    lastActiveOrganization = await ctx.db.query.organization.findFirst({
      where: eq(organization.id, userData.lastActiveOrganizationId),
    });
  }

  if (userData.lastActiveWorkspaceId) {
    lastActiveWorkspace = await ctx.db.query.workspace.findFirst({
      where: eq(workspace.id, userData.lastActiveWorkspaceId),
    });
  }

  return {
    ...userData,
    accounts,
    lastActiveOrganization,
    lastActiveWorkspace,
  };
});
