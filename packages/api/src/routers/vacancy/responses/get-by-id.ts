import { eq } from "@selectio/db";
import { vacancyResponse } from "@selectio/db/schema";
import { getDownloadUrl } from "@selectio/lib";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getById = protectedProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ ctx, input }) => {
    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.id),
      with: {
        vacancy: true,
        screening: true,
        conversation: true,
        resumePdfFile: true,
        telegramInterviewScoring: true,
      },
    });

    if (!response) {
      return null;
    }

    let resumePdfUrl: string | null = null;
    if (response.resumePdfFile) {
      resumePdfUrl = await getDownloadUrl(response.resumePdfFile.key);
    }

    return {
      ...response,
      resumePdfUrl,
    };
  });
