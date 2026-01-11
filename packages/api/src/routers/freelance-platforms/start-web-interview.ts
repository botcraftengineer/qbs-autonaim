import { and, eq } from "@qbs-autonaim/db";
import {
  response as responseTable,
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

/**
 * Нормализует URL профиля для предотвращения дубликатов
 */
function normalizeProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    let normalized = `${urlObj.protocol.toLowerCase()}//${urlObj.host.toLowerCase()}`;
    normalized = normalized.replace(/:80$/, "").replace(/:443$/, "");
    const pathname = urlObj.pathname.replace(/\/$/, "") || "/";
    normalized += pathname;
    return normalized;
  } catch {
    const withoutQuery = url.split("?")[0] ?? url;
    const withoutFragment = withoutQuery.split("#")[0] ?? withoutQuery;
    return withoutFragment.replace(/\/$/, "") || url;
  }
}

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .regex(
    /(kwork\.ru|fl\.ru|freelance\.ru)/i,
    "Некорректный URL профиля платформы",
  );

const startWebInterviewInputSchema = z.object({
  token: z.string().min(1),
  freelancerInfo: z.object({
    name: z.string().min(1, "Имя обязательно").max(500),
    email: z.email("Некорректный email").optional(),
    platformProfileUrl: platformProfileUrlSchema,
    phone: z.string().max(50).optional(),
    telegram: z.string().max(100).optional(),
  }),
});

export const startWebInterview = publicProcedure
  .input(startWebInterviewInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      undefined,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Ищем токен в универсальной таблице interview_links
      const link = await ctx.db.query.interviewLink.findFirst({
        where: (l, { eq, and }) =>
          and(eq(l.token, input.token), eq(l.isActive, true)),
      });

      if (!link) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      if (link.expiresAt && link.expiresAt < new Date()) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      // Обработка по типу сущности
      if (link.entityType === "gig") {
        return await handleGigInterview(
          ctx,
          { id: link.id, gigId: link.entityId },
          input.freelancerInfo,
          errorHandler,
        );
      }

      // По умолчанию vacancy
      return await handleVacancyInterview(
        ctx,
        { id: link.id, entityId: link.entityId },
        input.freelancerInfo,
        errorHandler,
      );
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleDatabaseError(error as Error, {
        token: input.token,
        operation: "start_web_interview",
      });
    }
  });

/**
 * Обработка интервью для вакансии
 */
async function handleVacancyInterview(
  ctx: Parameters<
    Parameters<typeof publicProcedure.mutation>[0]
  >[0]["ctx"] extends infer T
    ? T
    : never,
  vacancyLink: { id: string; entityId: string },
  freelancerInfo: {
    name: string;
    email?: string;
    platformProfileUrl: string;
    phone?: string;
    telegram?: string;
  },
  errorHandler: ReturnType<typeof createErrorHandler>,
) {
  // Получаем вакансию
  const vacancy = await ctx.db.query.vacancy.findFirst({
    where: (v, { eq }) => eq(v.id, vacancyLink.entityId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });

  if (!vacancy) {
    throw await errorHandler.handleNotFoundError("Вакансия", {
      vacancyId: vacancyLink.entityId,
    });
  }

  if (!vacancy.isActive) {
    throw await errorHandler.handleValidationError("Вакансия закрыта", {
      vacancyId: vacancyLink.entityId,
    });
  }

  const normalizedProfileUrl = normalizeProfileUrl(
    freelancerInfo.platformProfileUrl,
  );

  // Проверяем дубликаты
  const existingResponse = await ctx.db.query.response.findFirst({
    where: and(
      eq(vacancyResponse.entityId, vacancyLink.entityId),
      eq(vacancyResponse.platformProfileUrl, normalizedProfileUrl),
    ),
  });

  if (existingResponse) {
    throw await errorHandler.handleConflictError(
      "Вы уже откликнулись на эту вакансию",
      {
        vacancyId: vacancyLink.entityId,
        platformProfileUrl: normalizedProfileUrl,
      },
    );
  }

  // Создаём отклик
  const [response] = await ctx.db
    .insert(vacancyResponse)
    .values({
      vacancyId: vacancyLink.entityId,
      resumeId: normalizedProfileUrl,
      resumeUrl: freelancerInfo.platformProfileUrl,
      candidateName: freelancerInfo.name,
      platformProfileUrl: normalizedProfileUrl,
      phone: freelancerInfo.phone,
      telegramUsername: freelancerInfo.telegram,
      importSource: "WEB_LINK",
      status: "NEW",
      respondedAt: new Date(),
    })
    .returning();

  if (!response) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create response"),
      {
        vacancyId: vacancyLink.entityId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Создаём interviewSession
  const [session] = await ctx.db
    .insert(interviewSession)
    .values({
      entityType: "vacancy_response",
      responseId: response.id,
      status: "active",
      lastChannel: "web",
      metadata: {
        candidateName: freelancerInfo.name,
        email: freelancerInfo.email,
      },
    })
    .returning();

  if (!session) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create interview session"),
      {
        responseId: response.id,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Генерируем приветственное сообщение
  const botName =
    vacancy.workspace?.botSettings?.botName || "Ассистент по найму";
  const companyName =
    vacancy.workspace?.botSettings?.name || "нашей компании";

  const welcomeMessage = `Здравствуйте, ${freelancerInfo.name}! 👋

Меня зовут ${botName}, я помогаю ${companyName} в подборе кандидатов на вакансию "${vacancy.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;

  await ctx.db.insert(interviewMessage).values({
    sessionId: session.id,
    role: "assistant",
    type: "text",
    channel: "web",
    content: welcomeMessage,
  });

  return {
    type: "vacancy" as const,
    sessionId: session.id,
    responseId: response.id,
    entityId: response.entityId,
    welcomeMessage,
  };
}

/**
 * Обработка интервью для гига
 */
async function handleGigInterview(
  ctx: Parameters<
    Parameters<typeof publicProcedure.mutation>[0]
  >[0]["ctx"] extends infer T
    ? T
    : never,
  gigLink: { id: string; gigId: string },
  freelancerInfo: {
    name: string;
    email?: string;
    platformProfileUrl: string;
    phone?: string;
    telegram?: string;
  },
  errorHandler: ReturnType<typeof createErrorHandler>,
) {
  // Получаем гиг
  const gig = await ctx.db.query.gig.findFirst({
    where: (g, { eq }) => eq(g.id, gigLink.entityId),
    with: {
      workspace: {
        with: {
          botSettings: true,
        },
      },
    },
  });

  if (!gig) {
    throw await errorHandler.handleNotFoundError("Задание", {
      gigId: gigLink.entityId,
    });
  }

  if (!gig.isActive) {
    throw await errorHandler.handleValidationError("Задание закрыто", {
      gigId: gigLink.entityId,
    });
  }

  const normalizedCandidateId = normalizeProfileUrl(
    freelancerInfo.platformProfileUrl,
  );

  // Проверяем дубликаты
  const existingResponse = await ctx.db.query.response.findFirst({
    where: (response, { and, eq }) =>
      and(
        eq(response.entityId, gigLink.entityId),
        eq(response.candidateId, normalizedCandidateId),
      ),
  });

  if (existingResponse) {
    throw await errorHandler.handleConflictError(
      "Вы уже откликнулись на это задание",
      {
        gigId: gigLink.entityId,
        candidateId: normalizedCandidateId,
      },
    );
  }

  // Создаём отклик для гига
  const [response] = await ctx.db
    .insert(gigResponse)
    .values({
      gigId: gigLink.entityId,
      candidateId: normalizedCandidateId,
      candidateName: freelancerInfo.name,
      profileUrl: freelancerInfo.platformProfileUrl,
      phone: freelancerInfo.phone,
      email: freelancerInfo.email,
      telegramUsername: freelancerInfo.telegram,
      contacts: {
        email: freelancerInfo.email,
        phone: freelancerInfo.phone,
        telegram: freelancerInfo.telegram,
      },
      importSource: "WEB_LINK",
      status: "NEW",
      respondedAt: new Date(),
    })
    .returning();

  if (!response) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create gig response"),
      {
        gigId: gigLink.entityId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Создаём interviewSession для гига
  const [session] = await ctx.db
    .insert(interviewSession)
    .values({
      entityType: "gig_response",
      responseId: response.id,
      status: "active",
      lastChannel: "web",
      metadata: {
        candidateName: freelancerInfo.name,
        email: freelancerInfo.email,
      },
    })
    .returning();

  if (!session) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create interview session"),
      {
        responseId: response.id,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Генерируем приветственное сообщение
  const botName =
    gig.workspace?.botSettings?.botName || "Ассистент по найму";
  const companyName = gig.workspace?.botSettings?.name || "нашей компании";

  const welcomeMessage = `Здравствуйте! 👋

Меня зовут ${botName}, я помогаю ${companyName} в подборе исполнителей на задание "${gig.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;

  await ctx.db.insert(interviewMessage).values({
    sessionId: session.id,
    role: "assistant",
    type: "text",
    channel: "web",
    content: welcomeMessage,
  });

  return {
    type: "gig" as const,
    sessionId: session.id,
    responseId: response.id,
    entityId: response.entityId,
    welcomeMessage,
  };
}
