import { count, eq } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getCount = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const result = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .where(eq(vacancyResponse.vacancyId, input.vacancyId));

    return { total: result[0]?.count ?? 0 };
  });
