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
  interviewMessage,
  interviewSession,
  responseScreening,
  vacancy,
  vacancyResponse,
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
          vacancyResponse,
          eq(responseScreening.responseId, vacancyResponse.id),
        )
        .where(eq(vacancyResponse.vacancyId, vacancyId));
      filteredResponseIds = screenedResponses.map((r) => r.responseId);
    } else if (screeningFilter === "not-evaluated") {
      const notEvaluated = await ctx.db
        .select({ id: vacancyResponse.id })
        .from(vacancyResponse)
        .leftJoin(
          responseScreening,
          eq(vacancyResponse.id, responseScreening.responseId),
        )
        .where(
          and(
            eq(vacancyResponse.vacancyId, vacancyId),
            sql`${responseScreening.responseId} IS NULL`,
          ),
        );
      filteredResponseIds = notEvaluated.map((r) => r.id);
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

    // Добавляем поиск по ФИО кандидата
    if (search?.trim()) {
      whereConditions.push(
        ilike(vacancyResponse.candidateName, `%${search.trim()}%`),
      );
    }

    // Добавляем фильтр по статусу
    if (statusFilter && statusFilter.length > 0) {
      whereConditions.push(inArray(vacancyResponse.status, statusFilter));
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
    const responsesRaw = await ctx.db.query.vacancyResponse.findMany({
      where: whereCondition,
      orderBy: [orderByClause],
      limit,
      offset,
      columns: {
        id: true,
        vacancyId: true,
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
    });

    // Query related data separately
    const responseIds = responsesRaw.map((r) => r.id);

    const screenings =
      responseIds.length > 0
        ? await ctx.db.query.responseScreening.findMany({
            where: (s, { inArray }) => inArray(s.responseId, responseIds),
            columns: {
              responseId: true,
              score: true,
              detailedScore: true,
              analysis: true,
            },
          })
        : [];

    const interviewScorings =
      responseIds.length > 0
        ? await ctx.db.query.interviewScoring.findMany({
            where: (is, { inArray }) => inArray(is.responseId, responseIds),
            columns: {
              responseId: true,
              score: true,
              analysis: true,
            },
          })
        : [];

    const sessions =
      responseIds.length > 0
        ? await ctx.db.query.interviewSession.findMany({
            where: (s, { inArray }) =>
              inArray(s.vacancyResponseId, responseIds),
            columns: {
              id: true,
              vacancyResponseId: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          })
        : [];

    // Получаем количество сообщений для каждой сессии одним запросом
    const sessionIds = sessions.map((s) => s.id);

    let messageCountsMap = new Map<string, number>();
    if (sessionIds.length > 0) {
      const messageCounts = await ctx.db
        .select({
          sessionId: interviewMessage.sessionId,
          count: sql<number>`count(*)::int`,
        })
        .from(interviewMessage)
        .where(inArray(interviewMessage.sessionId, sessionIds))
        .groupBy(interviewMessage.sessionId);

      messageCountsMap = new Map(
        messageCounts.map((mc) => [mc.sessionId, mc.count]),
      );
    }

    // Формируем ответ с количеством сообщений и санитизацией HTML
    let responses = responsesRaw.map((r) => {
      const screening = screenings.find((s) => s.responseId === r.id);
      const interviewScoring = interviewScorings.find(
        (is) => is.responseId === r.id,
      );
      const session = sessions.find((s) => s.vacancyResponseId === r.id);

      return {
        ...r,
        screening: screening
          ? {
              score: screening.score,
              detailedScore: screening.detailedScore,
              analysis: screening.analysis
                ? sanitizeHtml(screening.analysis)
                : null,
            }
          : null,
        interviewScoring: interviewScoring
          ? {
              score: interviewScoring.score,
              analysis: interviewScoring.analysis
                ? sanitizeHtml(interviewScoring.analysis)
                : null,
            }
          : null,
        interviewSession: session
          ? {
              id: session.id,
              status: session.status,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt,
              messageCount: messageCountsMap.get(session.id) || 0,
            }
          : null,
      };
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
