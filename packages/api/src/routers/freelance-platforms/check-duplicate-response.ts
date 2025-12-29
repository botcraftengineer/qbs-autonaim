import { and, eq } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const checkDuplicateResponseInputSchema = z.object({
  vacancyId: z.string().uuid(),
  platformProfileUrl: z.string().min(1),
});

export const checkDuplicateResponse = publicProcedure
  .input(checkDuplicateResponseInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем дубликаты по platformProfileUrl + vacancyId
    const existingResponse = await ctx.db.query.vacancyResponse.findFirst({
      where: and(
        eq(vacancyResponse.vacancyId, input.vacancyId),
        eq(vacancyResponse.platformProfileUrl, input.platformProfileUrl),
      ),
    });

    return {
      isDuplicate: !!existingResponse,
      existingResponseId: existingResponse?.id,
    };
  });
