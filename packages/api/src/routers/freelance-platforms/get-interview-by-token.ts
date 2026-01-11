import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getInterviewByTokenInputSchema = z.object({
  token: z.string().min(1),
});

/**
 * Универсальный эндпоинт для получения данных интервью по токену.
 * Ищет токен в таблице interview_links и возвращает
 * тип сущности (vacancy | gig) и соответствующие данные.
 */
export const getInterviewByToken = publicProcedure
  .input(getInterviewByTokenInputSchema)
  .query(async ({ input, ctx }) => {
    // Ищем в универсальной таблице interview_links
    const link = await ctx.db.query.interviewLink.findFirst({
      where: (l, { eq, and }) =>
        and(eq(l.token, input.token), eq(l.isActive, true)),
    });

    if (!link) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью недействительна или истекла",
      });
    }

    // Проверяем срок действия
    if (link.expiresAt && link.expiresAt < new Date()) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью истекла",
      });
    }

    // Обработка по типу сущности
    if (link.entityType === "gig") {
      // Получаем гиг
      const foundGig = await ctx.db.query.gig.findFirst({
        where: (g, { eq }) => eq(g.id, link.entityId),
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
          id: link.id,
          token: link.token,
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

    // Обработка vacancy (по умолчанию)
    const foundVacancy = await ctx.db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, link.entityId),
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
        id: link.id,
        token: link.token,
      },
      data: {
        id: foundVacancy.id,
        title: foundVacancy.title,
        description: foundVacancy.description,
        requirements: foundVacancy.requirements,
        source: foundVacancy.source,
      },
    };
  });
