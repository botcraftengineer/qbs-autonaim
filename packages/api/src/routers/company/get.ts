import { eq } from "@selectio/db";
import { company } from "@selectio/db/schema";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure.query(async ({ ctx }) => {
  const result = await ctx.db.query.company.findFirst({
    where: eq(company.userId, ctx.session.user.id),
  });

  return result ?? null;
});
