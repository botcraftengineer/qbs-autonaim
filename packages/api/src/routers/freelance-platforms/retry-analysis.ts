import { eq } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { inngest } from "../../../../jobs/src/inngest/client";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const retryAnalysisInputSchema = z.object({
  responseId: z.string().uuid(),
});

/**
 * Ручной повтор AI-анализа для неудачного отклика
 * Требование: 6.6, 14.2
 */
export const retryAnalysis = protectedProcedure
  .input(retryAnalysisInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверка существования отклика
      const response = await ctx.db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, input.responseId),
        with: {
          vacancy: true,
        },
      });

      if (!response) {
        throw await errorHandler.handleNotFoundError("Отклик", {
          responseId: input.responseId,
        });
      }

      // Проверка доступа к workspace вакансии
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        response.vacancy.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        throw await errorHandler.handleAuthorizationError("отклика", {
          responseId: input.responseId,
          workspaceId: response.vacancy.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Запускаем повторный AI-анализ через Inngest
      await inngest.send({
        name: "freelance/response.analyze",
        data: {
          responseId: input.responseId,
        },
      });

      // Логируем действие
      await ctx.auditLogger.logAccess({
        userId: ctx.session.user.id,
        action: "UPDATE",
        resourceType: "VACANCY_RESPONSE",
        resourceId: input.responseId,
        metadata: {
          action: "RETRY_ANALYSIS",
          vacancyId: response.vacancyId,
          candidateName: response.candidateName,
        },
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      });

      return {
        success: true,
        message: "AI-анализ запущен повторно",
        responseId: input.responseId,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      throw await errorHandler.handleInternalError(error as Error, {
        responseId: input.responseId,
        operation: "retry_analysis",
      });
    }
  });
