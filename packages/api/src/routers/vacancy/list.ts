import { desc } from "@selectio/db";
import { protectedProcedure } from "../../trpc";
import { vacancy } from "@selectio/db/schema";

export const list = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.vacancy.findMany({
    orderBy: [desc(vacancy.createdAt)],
  });
});
