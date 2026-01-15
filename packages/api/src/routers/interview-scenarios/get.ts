import { and, eq } from "@qbs-autonaim/db";
import { interviewScenario } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const get = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      workspaceId: z.string(),
    }),
  )
  .query(async ({ input, ctx }) => {
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

    // Получаем сценарий
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

    return scenario;
  });
