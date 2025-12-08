import { desc } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { protectedProcedure } from "../../../trpc";

export const listAll = protectedProcedure.query(({ ctx }) => {
  return ctx.db.query.vacancyResponse.findMany({
    orderBy: [desc(vacancyResponse.createdAt)],
    with: {
      vacancy: true,
      screening: true,
      telegramInterviewScoring: true,
    },
  });
});
