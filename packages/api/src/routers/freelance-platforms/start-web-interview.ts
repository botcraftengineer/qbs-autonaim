import {
  conversation,
  conversationMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { publicProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

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
    email: z.string().email("Некорректный email"),
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
      // Валидируем токен
      const linkGenerator = new InterviewLinkGenerator();
      const interviewLink = await linkGenerator.validateLink(input.token);

      if (!interviewLink) {
        throw await errorHandler.handleNotFoundError("Ссылка на интервью", {
          token: input.token,
        });
      }

      // Проверяем, что вакансия активна
      const vacancy = await ctx.db.query.vacancy.findFirst({
        where: (vacancy, { eq }) => eq(vacancy.id, interviewLink.vacancyId),
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
          vacancyId: interviewLink.vacancyId,
        });
      }

      if (!vacancy.isActive) {
        throw await errorHandler.handleValidationError("Вакансия закрыта", {
          vacancyId: interviewLink.vacancyId,
        });
      }

      // Проверяем дубликаты по platformProfileUrl + vacancyId
      const existingResponse = await ctx.db.query.vacancyResponse.findFirst({
        where: (response, { and, eq }) =>
          and(
            eq(response.vacancyId, interviewLink.vacancyId),
            eq(
              response.platformProfileUrl,
              input.freelancerInfo.platformProfileUrl,
            ),
          ),
      });

      if (existingResponse) {
        throw await errorHandler.handleConflictError(
          "Вы уже откликнулись на эту вакансию",
          {
            vacancyId: interviewLink.vacancyId,
            platformProfileUrl: input.freelancerInfo.platformProfileUrl,
          },
        );
      }

      // Создаём отклик
      const [response] = await ctx.db
        .insert(vacancyResponse)
        .values({
          vacancyId: interviewLink.vacancyId,
          resumeId: `freelance_web_${crypto.randomUUID()}`,
          resumeUrl: input.freelancerInfo.platformProfileUrl,
          candidateName: input.freelancerInfo.name,
          platformProfileUrl: input.freelancerInfo.platformProfileUrl,
          phone: input.freelancerInfo.phone,
          telegramUsername: input.freelancerInfo.telegram,
          contacts: {
            email: input.freelancerInfo.email,
            phone: input.freelancerInfo.phone,
            telegram: input.freelancerInfo.telegram,
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
            vacancyId: interviewLink.vacancyId,
            freelancerName: input.freelancerInfo.name,
          },
        );
      }

      // Создаём conversation с source='WEB'
      const [conv] = await ctx.db
        .insert(conversation)
        .values({
          responseId: response.id,
          candidateName: input.freelancerInfo.name,
          username: input.freelancerInfo.email,
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
            freelancerName: input.freelancerInfo.name,
          },
        );
      }

      // Генерируем приветственное сообщение
      const botName =
        vacancy.workspace?.companySettings?.botName || "Ассистент по найму";
      const companyName =
        vacancy.workspace?.companySettings?.name || "нашей компании";

      const welcomeMessage = `Здравствуйте, ${input.freelancerInfo.name}! 👋

Меня зовут ${botName}, я помогаю ${companyName} в подборе кандидатов на вакансию "${vacancy.title}".

Я проведу с вами короткое интервью, чтобы лучше понять ваш опыт и навыки. Это займёт около 10-15 минут.

Готовы начать?`;

      // Сохраняем приветственное сообщение
      await ctx.db.insert(conversationMessage).values({
        conversationId: conv.id,
        sender: "BOT",
        contentType: "TEXT",
        channel: conv.source,
        content: welcomeMessage,
      });

      return {
        conversationId: conv.id,
        responseId: response.id,
        vacancyId: response.vacancyId,
        welcomeMessage,
      };
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
