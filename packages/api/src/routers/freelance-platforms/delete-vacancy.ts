import { eq } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

const deleteVacancyInputSchema = z.object({
  vacancyId: z.string().uuid(),
  workspaceId: workspaceIdSchema,
  dataCleanupOption: z.enum(["anonymize", "delete"]),
});

export const deleteVacancy = protectedProcedure
  .input(deleteVacancyInputSchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Проверяем доступ к workspace
      const hasAccess = await ctx.workspaceRepository.checkAccess(
        input.workspaceId,
        ctx.session.user.id,
      );

      if (!hasAccess) {
        await errorHandler.handleAuthorizationError("workspace", {
          workspaceId: input.workspaceId,
          userId: ctx.session.user.id,
        });
      }

      // Проверяем существование вакансии и принадлежность к workspace
      const existingVacancy = await ctx.db.query.vacancy.findFirst({
        where: (vacancy, { eq, and }) =>
          and(
            eq(vacancy.id, input.vacancyId),
            eq(vacancy.workspaceId, input.workspaceId),
          ),
      });

      if (!existingVacancy) {
        await errorHandler.handleNotFoundError("Вакансия", {
          vacancyId: input.vacancyId,
          workspaceId: input.workspaceId,
        });
      }

      // Выполняем очистку данных в зависимости от выбора пользователя
      if (input.dataCleanupOption === "anonymize") {
        // Анонимизируем персональные данные фрилансеров
        await ctx.db
          .update(vacancyResponse)
          .set({
            candidateName: "Анонимный кандидат",
            telegramUsername: null,
            chatId: null,
            phone: null,
            contacts: null,
            coverLetter: "Данные анонимизированы",
            platformProfileUrl: null,
            resumeUrl: "https://anonymized.url",
          })
          .where(eq(vacancyResponse.vacancyId, input.vacancyId));

        // Логируем анонимизацию
        await ctx.auditLogger.logVacancyDeletion({
          userId: ctx.session.user.id,
          vacancyId: input.vacancyId,
          deletionType: "anonymize",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
      } else {
        // Удаляем все связанные данные (каскадное удаление настроено в схеме)
        // Логируем удаление перед фактическим удалением
        await ctx.auditLogger.logVacancyDeletion({
          userId: ctx.session.user.id,
          vacancyId: input.vacancyId,
          deletionType: "delete",
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
        });
      }

      // Удаляем вакансию (если выбрано "delete", каскадное удаление удалит и отклики)
      await ctx.db.delete(vacancy).where(eq(vacancy.id, input.vacancyId));

      return {
        success: true,
        message:
          input.dataCleanupOption === "anonymize"
            ? "Вакансия удалена, данные фрилансеров анонимизированы"
            : "Вакансия и все связанные данные удалены",
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      await errorHandler.handleDatabaseError(error as Error, {
        vacancyId: input.vacancyId,
        operation: "delete_vacancy",
      });
    }
  });
