import { and, eq, sql } from "@qbs-autonaim/db";
import {
  interviewLink,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { getInterviewUrlFromDb } from "@qbs-autonaim/shared";
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
        importSource: responseTable.importSource,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(responseTable)
      .where(
        and(
          eq(responseTable.entityId, input.id),
          eq(responseTable.entityType, "vacancy"),
        ),
      )
      .groupBy(responseTable.importSource);

    // Получаем активную ссылку на интервью
    const activeInterviewLink = await ctx.db.query.interviewLink.findFirst({
      where: (link, { eq, and }: { eq: any; and: any }) =>
        and(
          eq(link.entityId, input.id),
          eq(link.entityType, "vacancy"),
          eq(link.isActive, true),
        ),
    });

    // Формируем статистику в удобном формате
    const stats: Record<string, number> = {
      HH_API: 0,
      MANUAL: 0,
      WEB_LINK: 0,
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
            url: await getInterviewUrlFromDb(
              ctx.db,
              activeInterviewLink.token,
              input.workspaceId,
            ),
            token: activeInterviewLink.token,
            isActive: activeInterviewLink.isActive,
            createdAt: activeInterviewLink.createdAt,
          }
        : null,
    };
  });
