import { and, count, eq, gte, sql } from "@selectio/db";
import { vacancyResponse, responseScreening } from "@selectio/db/schema";
import { z } from "zod/v4";
import { protectedProcedure } from "../../trpc";

export const getAnalytics = protectedProcedure
  .input(z.object({ vacancyId: z.string() }))
  .query(async ({ ctx, input }) => {
    // Получаем общее количество откликов
    const totalResponsesResult = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .where(eq(vacancyResponse.vacancyId, input.vacancyId));

    const totalResponses = totalResponsesResult[0]?.count ?? 0;

    // Получаем количество обработанных откликов (с скринингом)
    const processedResponsesResult = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .innerJoin(
        responseScreening,
        eq(vacancyResponse.id, responseScreening.responseId)
      )
      .where(eq(vacancyResponse.vacancyId, input.vacancyId));

    const processedResponses = processedResponsesResult[0]?.count ?? 0;

    // Получаем количество кандидатов со скорингом >= 3
    const highScoreResponsesResult = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .innerJoin(
        responseScreening,
        eq(vacancyResponse.id, responseScreening.responseId)
      )
      .where(
        and(
          eq(vacancyResponse.vacancyId, input.vacancyId),
          gte(responseScreening.score, 3)
        )
      );

    const highScoreResponses = highScoreResponsesResult[0]?.count ?? 0;

    // Получаем количество кандидатов со скорингом >= 4
    const topScoreResponsesResult = await ctx.db
      .select({ count: count() })
      .from(vacancyResponse)
      .innerJoin(
        responseScreening,
        eq(vacancyResponse.id, responseScreening.responseId)
      )
      .where(
        and(
          eq(vacancyResponse.vacancyId, input.vacancyId),
          gte(responseScreening.score, 4)
        )
      );

    const topScoreResponses = topScoreResponsesResult[0]?.count ?? 0;

    // Получаем средний скоринг
    const avgScoreResult = await ctx.db
      .select({
        avg: sql<number>`COALESCE(AVG(${responseScreening.score}), 0)`,
      })
      .from(vacancyResponse)
      .innerJoin(
        responseScreening,
        eq(vacancyResponse.id, responseScreening.responseId)
      )
      .where(eq(vacancyResponse.vacancyId, input.vacancyId));

    const avgScore = avgScoreResult[0]?.avg ?? 0;

    return {
      totalResponses,
      processedResponses,
      highScoreResponses, // >= 3
      topScoreResponses, // >= 4
      avgScore: Math.round(avgScore * 10) / 10, // Округляем до 1 знака
    };
  });
