import { and, eq } from "@qbs-autonaim/db";
import { interviewLink, vacancy, workspace } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { getInterviewUrl } from "../../utils/get-interview-url";

const getInterviewLinkInputSchema = z.object({
  vacancyId: z.uuid(),
  workspaceId: workspaceIdSchema,
});

export const getInterviewLink = protectedProcedure
  .input(getInterviewLinkInputSchema)
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

    // Проверяем, существует ли вакансия и принадлежит ли она workspace
    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!vacancyData) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Получаем активную ссылку на интервью
    const activeInterviewLink = await ctx.db.query.interviewLink.findFirst({
      where: and(
        eq(interviewLink.vacancyId, input.vacancyId),
        eq(interviewLink.isActive, true),
      ),
    });

    if (!activeInterviewLink) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Ссылка на интервью не найдена для этой вакансии",
      });
    }

    const workspaceData = await ctx.db.query.workspace.findFirst({
      where: eq(workspace.id, input.workspaceId),
      columns: {
        interviewDomain: true,
      },
    });

    return {
      id: activeInterviewLink.id,
      vacancyId: activeInterviewLink.vacancyId,
      token: activeInterviewLink.token,
      url: getInterviewUrl(
        activeInterviewLink.token,
        workspaceData?.interviewDomain,
      ),
      isActive: activeInterviewLink.isActive,
      createdAt: activeInterviewLink.createdAt,
      expiresAt: activeInterviewLink.expiresAt,
    };
  });
