import { and, eq } from "@qbs-autonaim/db";
import {
  interviewScenario,
  UpdateInterviewScenarioSchema,
} from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
      data: UpdateInterviewScenarioSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { id, workspaceId, data } = input;

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

    // Обновляем сценарий
    const updatedScenario = await ctx.db
      .update(interviewScenario)
      .set(data)
      .where(eq(interviewScenario.id, id))
      .returning();

    if (!updatedScenario[0]) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Не удалось обновить сценарий",
      });
    }

    return updatedScenario[0];
  });
