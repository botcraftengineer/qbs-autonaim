import { eq, user } from "@selectio/db";
import { protectedProcedure } from "../../trpc";

export const me = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.user.findFirst({
    where: eq(user.id, ctx.session.user.id),
  });
});
