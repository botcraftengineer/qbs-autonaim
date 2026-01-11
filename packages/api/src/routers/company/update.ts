import { botSettings, eq } from "@qbs-autonaim/db";
import { companyFormSchema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: companyFormSchema,
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
        message: "Недостаточно прав для изменения настроек компании",
      });
    }

    // Проверяем существующие настройки
    const existing = await ctx.db.query.botSettings.findFirst({
      where: eq(botSettings.workspaceId, input.workspaceId),
    });

    if (existing) {
      // Обновляем существующие
      const [updated] = await ctx.db
        .update(botSettings)
        .set({
          name: input.data.name,
          website: input.data.website || null,
          description: input.data.description || null,
          botName: input.data.botName,
          botRole: input.data.botRole,
          updatedAt: new Date(),
        })
        .where(eq(botSettings.id, existing.id))
        .returning();

      return updated;
    }

    // Создаем новые
    const [created] = await ctx.db
      .insert(botSettings)
      .values({
        workspaceId: input.workspaceId,
        name: input.data.name,
        website: input.data.website || null,
        description: input.data.description || null,
        botName: input.data.botName,
        botRole: input.data.botRole,
      })
      .returning();

    return created;
  });
