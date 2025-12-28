import { count, desc, eq, sql } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const getVacanciesInputSchema = z.object({
  workspaceId: workspaceIdSchema,
  source: z
    .enum([
      "hh",
      "kwork",
      "fl",
      "weblancer",
      "upwork",
      "freelancer",
      "fiverr",
      "avito",
      "superjob",
    ])
    .optional(),
});

export const getVacancies = protectedProcedure
  .input(getVacanciesInputSchema)
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

    // Базовый запрос
    let query = ctx.db
      .select({
        id: vacancy.id,
        workspaceId: vacancy.workspaceId,
        title: vacancy.title,
        url: vacancy.url,
        views: vacancy.views,
        responses: vacancy.responses,
        newResponses: vacancy.newResponses,
        resumesInProgress: vacancy.resumesInProgress,
        suitableResumes: vacancy.suitableResumes,
        region: vacancy.region,
        description: vacancy.description,
        requirements: vacancy.requirements,
        source: vacancy.source,
        externalId: vacancy.externalId,
        customBotInstructions: vacancy.customBotInstructions,
        customScreeningPrompt: vacancy.customScreeningPrompt,
        customInterviewQuestions: vacancy.customInterviewQuestions,
        customOrganizationalQuestions: vacancy.customOrganizationalQuestions,
        isActive: vacancy.isActive,
        createdAt: vacancy.createdAt,
        updatedAt: vacancy.updatedAt,
        // Статистика по источникам откликов
        hhApiCount: sql<number>`COUNT(CASE WHEN ${vacancyResponse.importSource} = 'HH_API' THEN 1 END)`,
        freelanceManualCount: sql<number>`COUNT(CASE WHEN ${vacancyResponse.importSource} = 'FREELANCE_MANUAL' THEN 1 END)`,
        freelanceLinkCount: sql<number>`COUNT(CASE WHEN ${vacancyResponse.importSource} = 'FREELANCE_LINK' THEN 1 END)`,
        totalResponsesCount: count(vacancyResponse.id),
      })
      .from(vacancy)
      .leftJoin(vacancyResponse, eq(vacancy.id, vacancyResponse.vacancyId))
      .where(eq(vacancy.workspaceId, input.workspaceId))
      .$dynamic();

    // Фильтрация по источнику, если указан
    if (input.source) {
      query = query.where(eq(vacancy.source, input.source));
    }

    const vacancies = await query
      .groupBy(vacancy.id)
      .orderBy(desc(vacancy.createdAt));

    return vacancies;
  });
