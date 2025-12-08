import { eq } from "@qbs-autonaim/db";
import { protectedProcedure } from "../../trpc";
import { user } from "@qbs-autonaim/db/schema";

export const me = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.user.findFirst({
    where: eq(user.id, ctx.session.user.id),
  });
});
