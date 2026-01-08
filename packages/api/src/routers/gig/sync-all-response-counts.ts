import { and, count, eq } from "@qbs-autonaim/db";
import { gig, gigResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Синхронизирует счетчики откликов для всех gig в workspace
 * Используется для массового исправления рассинхронизации
 */
export const syncAllResponseCounts = protectedProcedure
  .input(
    z.object({
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

    // Получаем все gig в workspace
    const gigs = await ctx.db.query.gig.findMany({
      where: eq(gig.workspaceId, input.workspaceId),
      columns: {
        id: true,
        responses: true,
        newResponses: true,
      },
    });

    const results = [];

    // Синхронизируем счетчики для каждого gig
    for (const gigItem of gigs) {
      // Подсчитываем реальное количество откликов
      const totalResult = await ctx.db
        .select({ count: count() })
        .from(gigResponse)
        .where(eq(gigResponse.gigId, gigItem.id));

      const total = totalResult[0]?.count ?? 0;

      // Подсчитываем новые отклики (статус NEW)
      const newResult = await ctx.db
        .select({ count: count() })
        .from(gigResponse)
        .where(
          and(eq(gigResponse.gigId, gigItem.id), eq(gigResponse.status, "NEW")),
        );

      const newCount = newResult[0]?.count ?? 0;

      // Обновляем только если есть расхождение
      if (
        total !== (gigItem.responses ?? 0) ||
        newCount !== (gigItem.newResponses ?? 0)
      ) {
        await ctx.db
          .update(gig)
          .set({
            responses: total,
            newResponses: newCount,
          })
          .where(eq(gig.id, gigItem.id));

        results.push({
          gigId: gigItem.id,
          previousTotal: gigItem.responses ?? 0,
          newTotal: total,
          previousNew: gigItem.newResponses ?? 0,
          newNew: newCount,
          updated: true,
        });
      }
    }

    return {
      totalGigs: gigs.length,
      updatedGigs: results.length,
      results,
    };
  });
