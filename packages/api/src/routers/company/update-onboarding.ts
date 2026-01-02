import { companySettings, eq } from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updateOnboarding = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      onboardingCompleted: z.boolean().optional(),
      dismissedGettingStarted: z.boolean().optional(),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access || (access.role !== "owner" && access.role !== "admin")) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Недостаточно прав для изменения настроек онбординга",
      });
    }

    // Проверяем существующие настройки
    const existing = await ctx.db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, input.workspaceId),
    });

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (input.onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = input.onboardingCompleted;
      if (input.onboardingCompleted) {
        updateData.onboardingCompletedAt = new Date();
      }
    }

    if (input.dismissedGettingStarted !== undefined) {
      updateData.dismissedGettingStarted = input.dismissedGettingStarted;
      if (input.dismissedGettingStarted) {
        updateData.dismissedGettingStartedAt = new Date();
      }
    }

    if (existing) {
      // Обновляем существующие
      const [updated] = await ctx.db
        .update(companySettings)
        .set(updateData)
        .where(eq(companySettings.id, existing.id))
        .returning();

      return updated;
    }

    // Создаем новые с базовыми значениями
    const [created] = await ctx.db
      .insert(companySettings)
      .values({
        workspaceId: input.workspaceId,
        name: "Моя компания", // Значение по умолчанию
        ...updateData,
      })
      .returning();

    return created;
  });
