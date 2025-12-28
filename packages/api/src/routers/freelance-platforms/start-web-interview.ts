import {
  conversation,
  conversationMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { InterviewLinkGenerator } from "../../services";
import { publicProcedure } from "../../trpc";

const platformProfileUrlSchema = z
  .string()
  .min(1, "URL профиля обязателен")
  .regex(
    /(kwork\.ru|fl\.ru|weblancer\.net|upwork\.com|freelancer\.com)/i,
    "Некорректный URL профиля платформы",
  );

const startWebInterviewInputSchema = z.object({
  token: z.string().uuid(),
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
    // Валидируем токен
    const linkGenerator = new InterviewLinkGenerator();
    const interviewLink = await linkGenerator.validateLink(input.token);

    if (!interviewLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
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

    if (!vacancy || !vacancy.isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Вакансия закрыта",
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
      throw new TRPCError({
        code: "CONFLICT",
        message: "Вы уже откликнулись на эту вакансию",
      });
    }

    // Создаём отклик
    const [response] = await ctx.db
      .insert(vacancyResponse)
      .values({
        vacancyId: interviewLink.vacancyId,
        resumeId: `freelance_web_${Date.now()}`,
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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать отклик",
      });
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
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать разговор",
      });
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
      channel: "TELEGRAM",
      content: welcomeMessage,
    });

    return {
      conversationId: conv.id,
      responseId: response.id,
      vacancyId: response.vacancyId,
      welcomeMessage,
    };
  });
