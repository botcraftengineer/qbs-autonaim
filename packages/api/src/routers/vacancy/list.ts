import { desc } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.vacancy.findMany({
    orderBy: [desc(vacancy.createdAt)],
  });
});
