import { companySettings, eq } from "@qbs-autonaim/db";
import {
  companyPartialSchema,
  workspaceIdSchema,
} from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const updatePartial = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      data: companyPartialSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    const existing = await ctx.db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, input.workspaceId),
    });

    if (!existing) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Настройки компании не найдены",
      });
    }

    const updateData: Record<string, unknown> = { updatedAt: new Date() };

    if (input.data.name !== undefined) updateData.name = input.data.name;
    if (input.data.website !== undefined)
      updateData.website = input.data.website || null;
    if (input.data.description !== undefined)
      updateData.description = input.data.description || null;
    if (input.data.botName !== undefined)
      updateData.botName = input.data.botName;
    if (input.data.botRole !== undefined)
      updateData.botRole = input.data.botRole;

    const [updated] = await ctx.db
      .update(companySettings)
      .set(updateData)
      .where(eq(companySettings.id, existing.id))
      .returning();

    return updated;
  });
