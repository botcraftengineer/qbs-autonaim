/**
 * Get Dashboard Procedure
 *
 * Получает данные дашборда аналитики для workspace.
 * Защищённая процедура - требует авторизации.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { AnalyticsAggregator, AnalyticsError } from "../../services/analytics";
import { protectedProcedure } from "../../trpc";

const getDashboardInputSchema = z.object({
  workspaceId: z.string().min(1, "workspaceId обязателен"),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  granularity: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const getDashboard = protectedProcedure
  .input(getDashboardInputSchema)
  .query(async ({ ctx, input }) => {
    // Verify user has access to workspace
    const membership = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!membership) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const analyticsAggregator = new AnalyticsAggregator(ctx.db);

    try {
      const dashboard = await analyticsAggregator.getDashboard({
        workspaceId: input.workspaceId,
        period: input.period,
        granularity: input.granularity,
      });

      return dashboard;
    } catch (error) {
      if (error instanceof AnalyticsError) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error.userMessage,
          cause: error,
        });
      }
      throw error;
    }
  });
