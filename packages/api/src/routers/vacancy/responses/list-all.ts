import { desc } from "@selectio/db";

import { protectedProcedure } from "../../../trpc";
import { vacancyResponse } from "@selectio/db/schema";

export const listAll = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.vacancyResponse.findMany({
    orderBy: [desc(vacancyResponse.createdAt)],
    with: {
      vacancy: true,
    },
  });
});
