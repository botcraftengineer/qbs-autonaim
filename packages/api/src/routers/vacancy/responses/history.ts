import { desc, eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse, vacancyResponseHistory } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getHistory = protectedProcedure
  .input(z.object({ responseId: z.string().uuid(), workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    const access = await workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому workspace",
      });
    }

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.responseId),
      with: {
        vacancy: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const history = await ctx.db.query.vacancyResponseHistory.findMany({
      where: eq(vacancyResponseHistory.responseId, input.responseId),
      orderBy: [desc(vacancyResponseHistory.createdAt)],
    });

    return history;
  });
