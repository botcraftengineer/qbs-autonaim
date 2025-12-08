import { desc } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../../trpc";

export const listRecent = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.vacancyResponse.findMany({
    orderBy: [desc(vacancyResponse.createdAt)],
    limit: 5,
    with: {
      vacancy: true,
      screening: true,
      telegramInterviewScoring: true,
    },
  });
});
