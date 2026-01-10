import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getInterviewByTokenInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Универсальный эндпоинт для получения данных интервью по токену.
 * Ищет токен сначала в таблице vacancy interview links,
 * затем в gig interview links.
 * Возвращает тип сущности (vacancy | gig) и соответствующие данные.
 */
export const getInterviewByToken = publicProcedure
  .input(getInterviewByTokenInputSchema)
  .query(async ({ input, ctx }) => {
    // 1. Ищем в таблице interview_links (vacancy)
    const vacancyLink = await ctx.db.query.interviewLink.findFirst({
      where: (link, { eq, and }) =>
        and(eq(link.token, input.token), eq(link.isActive, true)),
    });

    if (vacancyLink) {
      // Проверяем срок действия
      if (vacancyLink.expiresAt && vacancyLink.expiresAt < new Date()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ссылка на интервью истекла",
        });
      }

      // Получаем вакансию
      const foundVacancy = await ctx.db.query.vacancy.findFirst({
        where: (v, { eq }) => eq(v.id, vacancyLink.entityId),
      });

      if (!foundVacancy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Вакансия не найдена",
        });
      }

      if (!foundVacancy.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Вакансия закрыта",
        });
      }

      return {
        type: "vacancy" as const,
        interviewLink: {
          id: vacancyLink.id,
          token: vacancyLink.token,
        },
        data: {
          id: foundVacancy.id,
          title: foundVacancy.title,
          description: foundVacancy.description,
          requirements: foundVacancy.requirements,
          source: foundVacancy.source,
        },
      };
    }

    // 2. Ищем в таблице gig_interview_links (gig)
    const gigLink = await ctx.db.query.gigInterviewLink.findFirst({
      where: (link, { eq, and }) =>
        and(eq(link.token, input.token), eq(link.isActive, true)),
    });

    if (gigLink) {
      // Проверяем срок действия
      if (gigLink.expiresAt && gigLink.expiresAt < new Date()) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ссылка на интервью истекла",
        });
      }

      // Получаем гиг
      const foundGig = await ctx.db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, gigLink.gigId),
      });

      if (!foundGig) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Задание не найдено",
        });
      }

      if (!foundGig.isActive) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Задание закрыто",
        });
      }

      return {
        type: "gig" as const,
        interviewLink: {
          id: gigLink.id,
          token: gigLink.token,
        },
        data: {
          id: foundGig.id,
          title: foundGig.title,
          description: foundGig.description,
          requirements: foundGig.requirements,
          source: foundGig.source,
        },
      };
    }

    // 3. Токен не найден ни в одной таблице
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Ссылка на интервью недействительна или истекла",
    });
  });
