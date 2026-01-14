import { and, desc, eq } from "@qbs-autonaim/db";
import {
  interviewMessage,
  interviewSession,
  response as responseTable,
} from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
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

  // Проверяем существующий отклик с сессиями
  const existingResponse = await ctx.db
    .select()
    .from(responseTable)
    .where(
      and(
        eq(responseTable.entityType, "vacancy"),
        eq(responseTable.entityId, vacancyLink.entityId),
        eq(responseTable.platformProfileUrl, normalizedProfileUrl),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existingResponse) {
    // Ищем последнюю сессию интервью
    const sessions = await ctx.db
      .select()
      .from(interviewSession)
      .where(eq(interviewSession.responseId, existingResponse.id))
      .orderBy(desc(interviewSession.createdAt))
      .limit(1);

    const activeSession = sessions[0];

    // Если есть активная сессия - возвращаем её
    if (activeSession && activeSession.status === "active") {
      const welcomeMessage = `Добро пожаловать! У вас уже есть активное интервью по этой вакансии. Продолжим?`;

      return {
        type: "vacancy" as const,
        sessionId: activeSession.id,
        responseId: existingResponse.id,
        entityId: existingResponse.entityId,
        welcomeMessage,
        isExisting: true,
      };
    }

    // Если сессия завершена - создаём новую
    if (activeSession && activeSession.status === "completed") {
      const [newSession] = await ctx.db
        .insert(interviewSession)
        .values({
          responseId: existingResponse.id,
          status: "active",
          lastChannel: "web",
          metadata: {
            candidateName: freelancerInfo.name,
            email: freelancerInfo.email,
          },
        })
        .returning();

      if (!newSession) {
        throw await errorHandler.handleInternalError(
          new Error("Failed to create new interview session"),
          {
            responseId: existingResponse.id,
          },
        );
      }

      const welcomeMessage = `Добро пожаловать снова! Начнём новое интервью по этой вакансии.`;

      await ctx.db.insert(interviewMessage).values({
        sessionId: newSession.id,
        role: "assistant",
        type: "text",
        channel: "web",
        content: welcomeMessage,
      });

      return {
        type: "vacancy" as const,
        sessionId: newSession.id,
        responseId: existingResponse.id,
        entityId: existingResponse.entityId,
        welcomeMessage,
        isExisting: true,
      };
    }
  }

  // Создаём отклик
  const [response] = await ctx.db
    .insert(responseTable)
    .values({
      entityType: "vacancy",
      entityId: vacancyLink.entityId,
      candidateId: normalizedProfileUrl,
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

  // Запускаем парсинг профиля в фоне
  try {
    await inngest.send({
      name: "freelance/profile.parse",
      data: {
        responseId: response.id,
      },
    });
  } catch (error) {
    console.warn("⚠️ Не удалось запустить парсинг профиля:", error);
    // Не прерываем основной поток, парсинг можно будет запустить позже
  }

  // Создаём interviewSession
  const [session] = await ctx.db
    .insert(interviewSession)
    .values({
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
  const botSettings = vacancy.workspace?.botSettings;
  const hasFullSettings =
    botSettings?.botName && botSettings?.botRole && botSettings?.companyName;

  const welcomeMessage = hasFullSettings
    ? `Здравствуйте, ${freelancerInfo.name}! 👋

Меня зовут ${botSettings.botName}, я ${botSettings.botRole} компании "${botSettings.companyName}". Я помогаю в подборе кандидатов на вакансию "${vacancy.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`
    : `Здравствуйте, ${freelancerInfo.name}! 👋

Я проведу с вами короткое интервью по вакансии "${vacancy.title}", чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

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
    where: (g, { eq }) => eq(g.id, gigLink.gigId),
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
      gigId: gigLink.gigId,
    });
  }

  if (!gig.isActive) {
    throw await errorHandler.handleValidationError("Задание закрыто", {
      gigId: gigLink.gigId,
    });
  }

  const normalizedCandidateId = normalizeProfileUrl(
    freelancerInfo.platformProfileUrl,
  );

  // Проверяем существующий отклик с сессиями
  const existingResponse = await ctx.db
    .select()
    .from(responseTable)
    .where(
      and(
        eq(responseTable.entityType, "gig"),
        eq(responseTable.entityId, gigLink.gigId),
        eq(responseTable.candidateId, normalizedCandidateId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (existingResponse) {
    // Ищем последнюю сессию интервью
    const sessions = await ctx.db
      .select()
      .from(interviewSession)
      .where(eq(interviewSession.responseId, existingResponse.id))
      .orderBy(desc(interviewSession.createdAt))
      .limit(1);

    const activeSession = sessions[0];

    // Если есть активная сессия - возвращаем её
    if (activeSession && activeSession.status === "active") {
      const welcomeMessage = `Добро пожаловать! У вас уже есть активное интервью по этому заданию. Продолжим?`;

      return {
        type: "gig" as const,
        sessionId: activeSession.id,
        responseId: existingResponse.id,
        entityId: existingResponse.entityId,
        welcomeMessage,
        isExisting: true,
      };
    }

    // Если сессия завершена - создаём новую
    if (activeSession && activeSession.status === "completed") {
      const [newSession] = await ctx.db
        .insert(interviewSession)
        .values({
          responseId: existingResponse.id,
          status: "active",
          lastChannel: "web",
          metadata: {
            candidateName: freelancerInfo.name,
            email: freelancerInfo.email,
          },
        })
        .returning();

      if (!newSession) {
        throw await errorHandler.handleInternalError(
          new Error("Failed to create new interview session"),
          {
            responseId: existingResponse.id,
          },
        );
      }

      const welcomeMessage = `Добро пожаловать снова! Начнём новое интервью по этому заданию.`;

      await ctx.db.insert(interviewMessage).values({
        sessionId: newSession.id,
        role: "assistant",
        type: "text",
        channel: "web",
        content: welcomeMessage,
      });

      return {
        type: "gig" as const,
        sessionId: newSession.id,
        responseId: existingResponse.id,
        entityId: existingResponse.entityId,
        welcomeMessage,
        isExisting: true,
      };
    }
  }

  // Создаём отклик для гига
  const [response] = await ctx.db
    .insert(responseTable)
    .values({
      entityType: "gig",
      entityId: gigLink.gigId,
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
        gigId: gigLink.gigId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Запускаем парсинг профиля в фоне
  try {
    await inngest.send({
      name: "freelance/profile.parse",
      data: {
        responseId: response.id,
      },
    });
  } catch (error) {
    console.warn("⚠️ Не удалось запустить парсинг профиля:", error);
    // Не прерываем основной поток, парсинг можно будет запустить позже
  }

  // Создаём interviewSession для гига
  const [session] = await ctx.db
    .insert(interviewSession)
    .values({
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
  const botSettings = gig.workspace?.botSettings;
  const hasFullSettings =
    botSettings?.botName && botSettings?.botRole && botSettings?.companyName;

  const welcomeMessage = hasFullSettings
    ? `Здравствуйте! 👋

Меня зовут ${botSettings.botName}, я ${botSettings.botRole} компании "${botSettings.companyName}". Я помогаю в подборе исполнителей на задание "${gig.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`
    : `Здравствуйте! 👋

Я проведу с вами короткое интервью по заданию "${gig.title}", чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

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
