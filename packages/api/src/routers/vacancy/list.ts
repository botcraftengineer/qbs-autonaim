import { count, desc, eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { protectedProcedure } from "../../trpc";

export const list = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const vacancies = await ctx.db
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
        realResponsesCount: count(vacancyResponse.id),
      })
      .from(vacancy)
      .leftJoin(vacancyResponse, eq(vacancy.id, vacancyResponse.vacancyId))
      .where(eq(vacancy.workspaceId, input.workspaceId))
      .groupBy(vacancy.id)
      .orderBy(desc(vacancy.createdAt));

    return vacancies;
  });
