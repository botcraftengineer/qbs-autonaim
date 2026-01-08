import { env } from "@qbs-autonaim/config";
import { and, eq, sql } from "@qbs-autonaim/db";
import {
  interviewLink,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const getVacancyByIdInputSchema = z.object({
  id: z.uuid(),
  workspaceId: workspaceIdSchema,
});

export const getVacancyById = protectedProcedure
  .input(getVacancyByIdInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    // Получаем вакансию
    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.id),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем статистику по источникам откликов
    const responseStats = await ctx.db
      .select({
        importSource: vacancyResponse.importSource,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(vacancyResponse)
      .where(eq(vacancyResponse.vacancyId, input.id))
      .groupBy(vacancyResponse.importSource);

    // Получаем активную ссылку на интервью
    const activeInterviewLink = await ctx.db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.vacancyId, input.id),
        eq(interviewLink.isActive, true),
      ),
    });

    // Формируем статистику в удобном формате
    const stats = {
      HH_API: 0,
      FREELANCE_MANUAL: 0,
      FREELANCE_LINK: 0,
    };

    for (const stat of responseStats) {
      if (stat.importSource) {
        stats[stat.importSource] = stat.count;
      }
    }

    return {
      vacancy: vacancyData,
      responseStats: stats,
      interviewLink: activeInterviewLink
        ? {
            url: `${env.NEXT_PUBLIC_INTERVIEW_URL || "https://interview.domain.ru"}/${activeInterviewLink.token}`,
            token: activeInterviewLink.token,
            isActive: activeInterviewLink.isActive,
            createdAt: activeInterviewLink.createdAt,
          }
        : null,
    };
  });
