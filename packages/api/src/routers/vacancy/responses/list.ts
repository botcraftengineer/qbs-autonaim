import type { SQL } from "@qbs-autonaim/db";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lt,
  sql,
} from "@qbs-autonaim/db";
import {
  conversationMessage,
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
      sortField: z
        .enum(["createdAt", "score", "detailedScore", "status", "respondedAt"])
        .optional()
        .nullable()
        .default(null),
      sortDirection: z.enum(["asc", "desc"]).default("desc"),
      screeningFilter: z
        .enum(["all", "evaluated", "not-evaluated", "high-score", "low-score"])
        .default("all"),
      statusFilter: z
        .array(
          z.enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"]),
        )
        .optional(),
      search: z.string().optional(),
    }),
  )
  .query(async ({ ctx, input }) => {
    const {
      workspaceId,
      vacancyId,
      page,
      limit,
      sortField,
      sortDirection,
      screeningFilter,
      statusFilter,
      search,
    } = input;
    const offset = (page - 1) * limit;

    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Проверка принадлежности вакансии к workspace
    const vacancyCheck = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, vacancyId),
        eq(vacancy.workspaceId, workspaceId),
      ),
    });

    if (!vacancyCheck) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем ID откликов с учётом фильтра по скринингу
    let filteredResponseIds: string[] | null = null;

    if (screeningFilter === "evaluated") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, vacancyId),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "not-evaluated") {
      // Оптимизация: используем LEFT JOIN вместо двух запросов
      const notEvaluated = await ctx.db
        .select({ id: responseTable.id })
        .from(responseTable)
        .leftJoin(
          responseScreening,
          eq(responseTable.id, responseScreening.responseId),
        )
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, vacancyId),
            sql`${responseScreening.responseId} IS NULL`,
          ),
        );
      filteredResponseIds = notEvaluated.map((r) => r.id);
    } else if (screeningFilter === "high-score") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, vacancyId),
            gte(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "low-score") {
      const screenedResponses = await ctx.db
        .select({ responseId: responseScreening.responseId })
        .from(responseScreening)
        .innerJoin(
          responseTable,
          eq(responseScreening.responseId, responseTable.id),
        )
        .where(
          and(
            eq(responseTable.entityType, "vacancy"),
            eq(responseTable.entityId, vacancyId),
            lt(responseScreening.score, 4),
          ),
        );
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    }

    // Базовое условие WHERE
    const whereConditions: SQL[] = [
      eq(responseTable.entityType, "vacancy"),
      eq(responseTable.entityId, vacancyId),
    ];
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
      whereConditions.push(inArray(responseTable.id, filteredResponseIds));
    }

    // Добавляем поиск по ФИО кандидата
    if (search?.trim()) {
      whereConditions.push(
        ilike(responseTable.candidateName, `%${search.trim()}%`),
      );
    }

    // Добавляем фильтр по статусу
    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(inArray(responseTable.status, statusFilter));
    }

    const whereCondition = and(...whereConditions);

    // Определяем сортировку
    let orderByClause: SQL;
    if (sortField === "createdAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.createdAt)
          : desc(responseTable.createdAt);
    } else if (sortField === "status") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.status)
          : desc(responseTable.status);
    } else if (sortField === "respondedAt") {
      orderByClause =
        sortDirection === "asc"
          ? asc(responseTable.respondedAt)
          : desc(responseTable.respondedAt);
    } else {
      orderByClause = desc(responseTable.createdAt);
    }

    // Получаем отфильтрованные данные с пагинацией
    // Оптимизация: загружаем только нужные поля
    const responsesRaw = await ctx.db.query.response.findMany({
      where: whereCondition,
      orderBy: [orderByClause],
      limit,
      offset,
      columns: {
        id: true,
        entityId: true,
        candidateName: true,
        photoFileId: true,
        status: true,
        hrSelectionStatus: true,
        contacts: true,
        experience: true,
        profileUrl: true,
        telegramUsername: true,
        phone: true,
        respondedAt: true,
        welcomeSentAt: true,
        createdAt: true,
      },
      with: {
        screening: {
          columns: {
            score: true,
            detailedScore: true,
            analysis: true,
          },
        },
        interviewScoring: {
          columns: {
            score: true,
            detailedScore: true,
            analysis: true,
          },
        },
        conversation: {
          columns: {
            id: true,
            candidateName: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Получаем количество сообщений для каждой беседы одним запросом
    const conversationIds = responsesRaw
      .filter((r) => r.conversation)
      .map((r) => r.conversation?.id)
      .filter((id): id is string => id !== undefined);

    let messageCountsMap = new Map<string, number>();
    if (conversationIds.length > 0) {
      const messageCounts = await ctx.db
        .select({
          conversationId: conversationMessage.conversationId,
          count: sql<number>`count(*)::int`,
        })
        .from(conversationMessage)
        .where(inArray(conversationMessage.conversationId, conversationIds))
        .groupBy(conversationMessage.conversationId);

      messageCountsMap = new Map(
        messageCounts.map((mc) => [mc.conversationId, mc.count]),
      );
    }

    // Формируем ответ с количеством сообщений и санитизацией HTML
    let responses = responsesRaw.map((r) => ({
      ...r,
      screening: r.screening
        ? {
            ...r.screening,
            analysis: r.screening.analysis
              ? sanitizeHtml(r.screening.analysis)
              : null,
          }
        : null,
      interviewScoring: r.interviewScoring
        ? {
            ...r.interviewScoring,
            analysis: r.interviewScoring.analysis
              ? sanitizeHtml(r.interviewScoring.analysis)
              : null,
          }
        : null,
      conversation: r.conversation
        ? {
            ...r.conversation,
            messageCount: messageCountsMap.get(r.conversation.id) || 0,
          }
        : null,
    }));

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
      .from(responseTable)
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
