import { desc, eq } from "@selectio/db";
import { vacancyResponse } from "@selectio/db/schema";
import { z } from "zod/v4";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(z.object({ vacancyId: z.string() }))
  .query(async ({ ctx, input }) => {
    const responses = await ctx.db.query.vacancyResponse.findMany({
      where: eq(vacancyResponse.vacancyId, input.vacancyId),
      orderBy: [desc(vacancyResponse.createdAt)],
      with: {
        screening: true,
      },
    });

    return responses;
  });
