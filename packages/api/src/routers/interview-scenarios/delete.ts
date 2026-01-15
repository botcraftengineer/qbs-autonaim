import { and, eq, sql } from "@qbs-autonaim/db";
import { gig, interviewScenario } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const deleteItem = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { id, workspaceId } = input;

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

    // Проверяем существование сценария
    const scenario = await ctx.db.query.interviewScenario.findFirst({
      where: and(
        eq(interviewScenario.id, id),
        eq(interviewScenario.workspaceId, workspaceId),
        eq(interviewScenario.isActive, true),
      ),
    });

    if (!scenario) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Сценарий не найден",
      });
    }

    // Проверяем, используется ли сценарий в каких-либо gig'ах
    const usedInGigsResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(gig)
      .where(
        and(eq(gig.interviewScenarioId, id), eq(gig.workspaceId, workspaceId)),
      );

    const usedInGigs = usedInGigsResult[0]?.count ?? 0;

    if (usedInGigs > 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Невозможно удалить сценарий, который используется в заданиях",
      });
    }

    // Деактивируем сценарий вместо полного удаления
    await ctx.db
      .update(interviewScenario)
      .set({ isActive: false })
      .where(eq(interviewScenario.id, id));

    return { success: true };
  });
