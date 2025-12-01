import { companySettings, eq, workspaceRepository } from "@selectio/db";
import { companyFormSchema } from "@selectio/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string().regex(/^ws_[0-9a-f]{32}$/),
      data: companyFormSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
    // Проверка доступа к workspace
    const access = await workspaceRepository.checkAccess(
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
    const existing = await ctx.db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, input.workspaceId),
    });

    if (existing) {
      // Обновляем существующие
      const [updated] = await ctx.db
        .update(companySettings)
        .set({
          name: input.data.name,
          website: input.data.website || null,
          description: input.data.description || null,
          updatedAt: new Date(),
        })
        .where(eq(companySettings.id, existing.id))
        .returning();

      return updated;
    }

    // Создаем новые
    const [created] = await ctx.db
      .insert(companySettings)
      .values({
        workspaceId: input.workspaceId,
        name: input.data.name,
        website: input.data.website || null,
        description: input.data.description || null,
      })
      .returning();

    return created;
  });
