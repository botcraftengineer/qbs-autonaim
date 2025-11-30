import type { SQL } from "@selectio/db";
import { and, asc, desc, eq, gte, inArray, lt, sql } from "@selectio/db";
import { responseScreening, vacancyResponse } from "@selectio/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const list = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      sortField: z
        .enum(["createdAt", "score", "detailedScore", "status", "respondedAt"])
        .nullable()
        .default(null),
      sortDirection: z.enum(["asc", "desc"]).default("desc"),
      screeningFilter: z
        .enum(["all", "evaluated", "not-evaluated", "high-score", "low-score"])
        .default("all"),
    }),
  )
  .query(async ({ ctx, input }) => {
    const {
      vacancyId,
      page,
      limit,
      sortField,
      sortDirection,
      screeningFilter,
    } = input;
    const offset = (page - 1) * limit;

    // Получаем ID откликов с учётом фильтра по скринингу
    let filteredResponseIds: string[] | null = null;

    if (screeningFilter === "evaluated") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          vacancyResponse,
          eq(responseScreening.responseId, vacancyResponse.id),
        )
        .where(eq(vacancyResponse.vacancyId, vacancyId));
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "not-evaluated") {
      const allResponses = await ctx.db
        .select({ id: vacancyResponse.id })
        .from(vacancyResponse)
        .where(eq(vacancyResponse.vacancyId, vacancyId));
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          vacancyResponse,
          eq(responseScreening.responseId, vacancyResponse.id),
        )
        .where(eq(vacancyResponse.vacancyId, vacancyId));
      const screenedIds = new Set(screenedResponses.map((r) => r.responseId));
      filteredResponseIds = allResponses
        .filter((r) => !screenedIds.has(r.id))
        .map((r) => r.id);
    } else if (screeningFilter === "high-score") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          vacancyResponse,
          eq(responseScreening.responseId, vacancyResponse.id),
        )
        .where(
          and(
            eq(vacancyResponse.vacancyId, vacancyId),
            gte(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "low-score") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          vacancyResponse,
          eq(responseScreening.responseId, vacancyResponse.id),
        )
        .where(
          and(
            eq(vacancyResponse.vacancyId, vacancyId),
            lt(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    }

    // Базовое условие WHERE
    const whereConditions: SQL[] = [eq(vacancyResponse.vacancyId, vacancyId)];
    if (filteredResponseIds !== null) {
      if (filteredResponseIds.length === 0) {
        return {
          responses: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
      whereConditions.push(inArray(vacancyResponse.id, filteredResponseIds));
    }

    const whereCondition = and(...whereConditions);

    // Определяем сортировку
    let orderByClause: SQL;
    if (sortField === "createdAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(vacancyResponse.createdAt)
          : desc(vacancyResponse.createdAt);
    } else if (sortField === "status") {
      orderByClause =
        sortDirection === "asc"
          ? asc(vacancyResponse.status)
          : desc(vacancyResponse.status);
    } else if (sortField === "respondedAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(vacancyResponse.respondedAt)
          : desc(vacancyResponse.respondedAt);
    } else {
      orderByClause = desc(vacancyResponse.createdAt);
    }

    // Получаем отфильтрованные данные с пагинацией
    let responses = await ctx.db.query.vacancyResponse.findMany({
      where: whereCondition,
      orderBy: [orderByClause],
      limit,
      offset,
      with: {
        screening: true,
        conversation: {
          with: {
            messages: true,
          },
        },
      },
    });

    // Сортировка по score/detailedScore в памяти (только для текущей страницы)
    if (sortField === "score" || sortField === "detailedScore") {
      responses = responses.sort((a, b) => {
        const scoreA =
          sortField === "score"
            ? (a.screening?.score ?? -1)
            : (a.screening?.detailedScore ?? -1);
        const scoreB =
          sortField === "score"
            ? (b.screening?.score ?? -1)
            : (b.screening?.detailedScore ?? -1);
        return sortDirection === "asc" ? scoreA - scoreB : scoreB - scoreA;
      });
    }

    // Получаем общее количество для пагинации
    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(vacancyResponse)
      .where(whereCondition);

    const total = Number(totalResult[0]?.count ?? 0);

    return {
      responses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
