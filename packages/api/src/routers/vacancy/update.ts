import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancySettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      vacancyId: z.string(),
      workspaceId: workspaceIdSchema,
      settings: updateVacancySettingsSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    // Проверяем, что вакансия существует и принадлежит workspace
    const existingVacancy = await ctx.db.query.vacancy.findFirst({
      where: and(
        eq(vacancy.id, input.vacancyId),
        eq(vacancy.workspaceId, input.workspaceId),
      ),
    });

    if (!existingVacancy) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    // Обновляем настройки
    // Строим патч только с определенными полями (не undefined)
    const settings = input.settings;
    const patch: Partial<typeof vacancy.$inferInsert> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (settings.customBotInstructions !== undefined) {
      patch.customBotInstructions = settings.customBotInstructions;
    }
    if (settings.customScreeningPrompt !== undefined) {
      patch.customScreeningPrompt = settings.customScreeningPrompt;
    }
    if (settings.customInterviewQuestions !== undefined) {
      patch.customInterviewQuestions = settings.customInterviewQuestions;
    }
    if (settings.customOrganizationalQuestions !== undefined) {
      patch.customOrganizationalQuestions =
        settings.customOrganizationalQuestions;
    }
    if (settings.source !== undefined) {
      patch.source = settings.source === null ? null : settings.source;
    }
    if (settings.externalId !== undefined) {
      patch.externalId =
        settings.externalId === null ? null : settings.externalId;
    }
    if (settings.url !== undefined) {
      // Преобразуем пустую строку в null
      patch.url =
        settings.url === null || settings.url === "" ? null : settings.url;
    }

    const result = await ctx.db
      .update(vacancy)
      .set(patch)
      .where(
        and(
          eq(vacancy.id, input.vacancyId),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .returning();

    // Проверяем, что строка была обновлена (race condition: вакансия могла быть удалена)
    if (!result[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена",
      });
    }

    return result[0];
  });
