import { eq } from "@qbs-autonaim/db";
import { interviewScenario } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      questions: z.array(z.string()).optional(),
      settings: z.record(z.string(), z.unknown()).optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { workspaceId, ...data } = input;

    // Проверяем доступ к workspace
    const hasAccess = await ctx.workspaceRepository.checkAccess(
      workspaceId,
      ctx.session.user.id,
    );

    if (!hasAccess) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    // Создаем сценарий интервью
    const result = await ctx.db
      .insert(interviewScenario)
      .values({
        ...data,
        workspaceId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!result[0]) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось создать сценарий интервью",
      });
    }

    return result[0];
  });
