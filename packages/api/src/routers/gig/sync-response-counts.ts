import { and, count, eq } from "@qbs-autonaim/db";
import { gig, response } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Синхронизирует счетчики откликов в таблице gig с реальными данными
 * Используется для исправления рассинхронизации
 */
export const syncResponseCounts = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    // Проверяем что gig принадлежит workspace
    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    // Подсчитываем реальное количество откликов
    const totalResult = await ctx.db
      .select({ count: count() })
      .from(response)
      .where(
        and(eq(response.entityType, "gig"), eq(response.entityId, input.gigId)),
      );

    const total = totalResult[0]?.count ?? 0;

    // Подсчитываем новые отклики (статус NEW)
    const newResult = await ctx.db
      .select({ count: count() })
      .from(response)
      .where(
        and(
          eq(response.entityType, "gig"),
          eq(response.entityId, input.gigId),
          eq(response.status, "NEW"),
        ),
      );

    const newCount = newResult[0]?.count ?? 0;

    // Обновляем счетчики в таблице gig
    await ctx.db
      .update(gig)
      .set({
        responses: total,
        newResponses: newCount,
      })
      .where(eq(gig.id, input.gigId));

    return {
      total,
      new: newCount,
      previousTotal: existingGig.responses ?? 0,
      previousNew: existingGig.newResponses ?? 0,
      updated: true,
    };
  });
