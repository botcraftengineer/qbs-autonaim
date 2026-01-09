import { inngest } from "@qbs-autonaim/jobs/client";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

/**
 * Триггер пересчета рейтинга кандидатов
 *
 * Отправляет событие в Inngest для фоновой обработки
 * Requirements: 6.3
 */
export const recalculateRanking = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
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

    // Отправляем событие в Inngest для фоновой обработки
    await inngest.send({
      name: "gig/ranking.recalculate",
      data: {
        gigId: input.gigId,
        workspaceId: input.workspaceId,
        triggeredBy: ctx.session.user.id,
      },
    });

    return {
      success: true,
      message: "Пересчет рейтинга запущен",
    };
  });
