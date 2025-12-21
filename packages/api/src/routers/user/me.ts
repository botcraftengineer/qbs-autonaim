import { eq } from "@qbs-autonaim/db";
import { account, user } from "@qbs-autonaim/db/schema";
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

  return {
    ...userData,
    accounts,
  };
});
