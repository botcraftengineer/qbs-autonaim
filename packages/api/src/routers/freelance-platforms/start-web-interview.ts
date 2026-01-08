import {
  conversation,
  conversationMessage,
  gigResponse,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

/**
 * Нормализует URL профиля для предотвращения дубликатов
 * - Приводит к нижнему регистру
 * - Удаляет trailing slash
 * - Удаляет query параметры и фрагменты
 * - Удаляет стандартные порты (80, 443)
 */
function normalizeProfileUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Приводим протокол и хост к нижнему регистру
    let normalized = `${urlObj.protocol.toLowerCase()}//${urlObj.host.toLowerCase()}`;

    // Удаляем стандартные порты
    normalized = normalized.replace(/:80$/, "").replace(/:443$/, "");

    // Добавляем pathname без trailing slash
    const pathname = urlObj.pathname.replace(/\/$/, "") || "/";
    normalized += pathname;

    return normalized.toLowerCase();
  } catch {
    // Если URL невалидный, возвращаем нормализованную строку
    return (
      url.toLowerCase().replace(/\/$/, "").split("?")[0]?.split("#")[0] || url
    );
  }
}

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .regex(
    /(kwork\.ru|fl\.ru|weblancer\.net|upwork\.com|freelancer\.com)/i,
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
      // 1. Ищем токен в таблице vacancy interview links
      const vacancyLink = await ctx.db.query.interviewLink.findFirst({
        where: (link, { eq, and }) =>
          and(eq(link.token, input.token), eq(link.isActive, true)),
      });

      if (vacancyLink) {
        // Проверяем срок действия
        if (vacancyLink.expiresAt && vacancyLink.expiresAt < new Date()) {
          throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
            token: input.token,
          });
        }

        return await handleVacancyInterview(
          ctx,
          vacancyLink,
          input.freelancerInfo,
          errorHandler,
        );
      }

      // 2. Ищем токен в таблице gig interview links
      const gigLink = await ctx.db.query.gigInterviewLink.findFirst({
        where: (link, { eq, and }) =>
          and(eq(link.token, input.token), eq(link.isActive, true)),
      });

      if (gigLink) {
        // Проверяем срок действия
        if (gigLink.expiresAt && gigLink.expiresAt < new Date()) {
          throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
            token: input.token,
          });
        }

        return await handleGigInterview(
          ctx,
          gigLink,
          input.freelancerInfo,
          errorHandler,
        );
      }

      // 3. Токен не найден
      throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
        token: input.token,
      });
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
  vacancyLink: { id: string; vacancyId: string },
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
    where: (v, { eq }) => eq(v.id, vacancyLink.vacancyId),
    with: {
      workspace: {
        with: {
          companySettings: true,
        },
      },
    },
  });

  if (!vacancy) {
    throw await errorHandler.handleNotFoundError("Вакансия", {
      vacancyId: vacancyLink.vacancyId,
    });
  }

  if (!vacancy.isActive) {
    throw await errorHandler.handleValidationError("Вакансия закрыта", {
      vacancyId: vacancyLink.vacancyId,
    });
  }

  // Нормализуем URL для предотвращения дубликатов
  const normalizedProfileUrl = normalizeProfileUrl(
    freelancerInfo.platformProfileUrl,
  );

  // Проверяем дубликаты по нормализованному URL
  const existingResponse = await ctx.db.query.vacancyResponse.findFirst({
    where: (response, { and, eq }) =>
      and(
        eq(response.vacancyId, vacancyLink.vacancyId),
        eq(response.platformProfileUrl, normalizedProfileUrl),
      ),
  });

  if (existingResponse) {
    throw await errorHandler.handleConflictError(
      "Вы уже откликнулись на эту вакансию",
      {
        vacancyId: vacancyLink.vacancyId,
        platformProfileUrl: normalizedProfileUrl,
      },
    );
  }

  // Создаём отклик с нормализованным URL
  const [response] = await ctx.db
    .insert(vacancyResponse)
    .values({
      vacancyId: vacancyLink.vacancyId,
      resumeId: `freelance_web_${crypto.randomUUID()}`,
      resumeUrl: freelancerInfo.platformProfileUrl,
      candidateName: freelancerInfo.name,
      platformProfileUrl: normalizedProfileUrl,
      phone: freelancerInfo.phone,
      telegramUsername: freelancerInfo.telegram,
      contacts: {
        email: freelancerInfo.email,
        phone: freelancerInfo.phone,
        telegram: freelancerInfo.telegram,
      },
      importSource: "FREELANCE_LINK",
      status: "NEW",
      respondedAt: new Date(),
    })
    .returning();

  if (!response) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create response"),
      {
        vacancyId: vacancyLink.vacancyId,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Создаём conversation
  const [conv] = await ctx.db
    .insert(conversation)
    .values({
      responseId: response.id,
      candidateName: freelancerInfo.name,
      username: freelancerInfo.email,
      status: "ACTIVE",
      source: "WEB",
      metadata: {},
    })
    .returning();

  if (!conv) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create conversation"),
      {
        responseId: response.id,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Генерируем приветственное сообщение
  const botName =
    vacancy.workspace?.companySettings?.botName || "Ассистент по найму";
  const companyName =
    vacancy.workspace?.companySettings?.name || "нашей компании";

  const welcomeMessage = `Здравствуйте, ${freelancerInfo.name}! 👋

Меня зовут ${botName}, я помогаю ${companyName} в подборе кандидатов на вакансию "${vacancy.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;

  await ctx.db.insert(conversationMessage).values({
    conversationId: conv.id,
    sender: "BOT",
    contentType: "TEXT",
    channel: conv.source,
    content: welcomeMessage,
  });

  return {
    type: "vacancy" as const,
    conversationId: conv.id,
    responseId: response.id,
    entityId: response.vacancyId,
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
          companySettings: true,
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

  // Нормализуем URL для использования как candidateId и предотвращения дубликатов
  const normalizedCandidateId = normalizeProfileUrl(
    freelancerInfo.platformProfileUrl,
  );

  // Проверяем дубликаты по normalizedCandidateId + gigId (соответствует уникальному ограничению БД)
  const existingResponse = await ctx.db.query.gigResponse.findFirst({
    where: (response, { and, eq }) =>
      and(
        eq(response.gigId, gigLink.gigId),
        eq(response.candidateId, normalizedCandidateId),
      ),
  });

  if (existingResponse) {
    throw await errorHandler.handleConflictError(
      "Вы уже откликнулись на это задание",
      {
        gigId: gigLink.gigId,
        candidateId: normalizedCandidateId,
      },
    );
  }

  // Создаём отклик для гига с нормализованным candidateId
  const [response] = await ctx.db
    .insert(gigResponse)
    .values({
      gigId: gigLink.gigId,
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

  // Создаём conversation для гига
  const [conv] = await ctx.db
    .insert(conversation)
    .values({
      gigResponseId: response.id,
      candidateName: freelancerInfo.name,
      username: freelancerInfo.email,
      status: "ACTIVE",
      source: "WEB",
      metadata: {},
    })
    .returning();

  if (!conv) {
    throw await errorHandler.handleInternalError(
      new Error("Failed to create conversation"),
      {
        responseId: response.id,
        freelancerName: freelancerInfo.name,
      },
    );
  }

  // Генерируем приветственное сообщение
  const botName =
    gig.workspace?.companySettings?.botName || "Ассистент по найму";
  const companyName = gig.workspace?.companySettings?.name || "нашей компании";

  const welcomeMessage = `Здравствуйте, ${freelancerInfo.name}! 👋

Меня зовут ${botName}, я помогаю ${companyName} в подборе исполнителей на задание "${gig.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;

  await ctx.db.insert(conversationMessage).values({
    conversationId: conv.id,
    sender: "BOT",
    contentType: "TEXT",
    channel: conv.source,
    content: welcomeMessage,
  });

  return {
    type: "gig" as const,
    conversationId: conv.id,
    responseId: response.id,
    entityId: response.gigId,
    welcomeMessage,
  };
}
