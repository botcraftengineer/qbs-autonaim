import { and, eq } from "@qbs-autonaim/db";
import { vacancy } from "@qbs-autonaim/db/schema";
import {
  updateVacancySettingsSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updateSettings = protectedProcedure
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
    const patch: {
      customBotInstructions?: string | null;
      customScreeningPrompt?: string | null;
      customInterviewQuestions?: string | null;
      customOrganizationalQuestions?: string | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.settings.customBotInstructions !== undefined) {
      patch.customBotInstructions = input.settings.customBotInstructions;
    }
    if (input.settings.customScreeningPrompt !== undefined) {
      patch.customScreeningPrompt = input.settings.customScreeningPrompt;
    }
    if (input.settings.customInterviewQuestions !== undefined) {
      patch.customInterviewQuestions = input.settings.customInterviewQuestions;
    }
    if (input.settings.customOrganizationalQuestions !== undefined) {
      patch.customOrganizationalQuestions =
        input.settings.customOrganizationalQuestions;
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
