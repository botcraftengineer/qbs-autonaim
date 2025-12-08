import { and, desc, eq, inArray, lt, workspaceRepository } from "@selectio/db";
import {
  responseScreening,
  telegramInterviewScoring,
  vacancy,
  vacancyResponse,
} from "@selectio/db/schema";
import { workspaceIdSchema } from "@selectio/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listAll = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(20),
      cursor: z.coerce.date().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Запрашиваем limit + 1 для определения hasMore
    const responses = await ctx.db
      .select({
        response: vacancyResponse,
        vacancy: vacancy,
      })
      .from(vacancyResponse)
      .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
      .where(
        and(
          eq(vacancy.workspaceId, input.workspaceId),
          input.cursor
            ? lt(vacancyResponse.createdAt, input.cursor)
            : undefined,
        ),
      )
      .orderBy(desc(vacancyResponse.createdAt))
      .limit(input.limit + 1);

    const hasMore = responses.length > input.limit;
    const items = hasMore ? responses.slice(0, input.limit) : responses;

    if (items.length === 0) {
      return {
        items: [],
        nextCursor: undefined,
        hasMore: false,
      };
    }

    // Собираем все ID откликов для батчевых запросов
    const responseIds = items.map((r) => r.response.id);

    // Батчевый запрос screening
    const screenings = await ctx.db
      .select()
      .from(responseScreening)
      .where(inArray(responseScreening.responseId, responseIds));

    // Батчевый запрос telegramInterviewScoring
    const interviewScorings = await ctx.db
      .select()
      .from(telegramInterviewScoring)
      .where(inArray(telegramInterviewScoring.responseId, responseIds));

    // Создаем lookup maps
    const screeningMap = new Map(screenings.map((s) => [s.responseId, s]));
    const interviewScoringMap = new Map(
      interviewScorings.map((i) => [i.responseId, i]),
    );

    // Объединяем результаты
    const responsesWithRelations = items.map((r) => ({
      ...r.response,
      vacancy: r.vacancy,
      screening: screeningMap.get(r.response.id) ?? null,
      telegramInterviewScoring: interviewScoringMap.get(r.response.id) ?? null,
    }));

    const lastItem = items[items.length - 1];

    return {
      items: responsesWithRelations,
      nextCursor: hasMore && lastItem ? lastItem.response.createdAt : undefined,
      hasMore,
    };
  });
