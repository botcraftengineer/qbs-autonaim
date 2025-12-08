import { desc, eq, workspaceRepository } from "@selectio/db";
import { vacancy, vacancyResponse } from "@selectio/db/schema";
import { workspaceIdSchema } from "@selectio/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listAll = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
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

    const responses = await ctx.db.query.vacancyResponse.findMany({
      orderBy: [desc(vacancyResponse.createdAt)],
      with: {
        vacancy: true,
        screening: true,
        telegramInterviewScoring: true,
      },
    });

    // Фильтруем только отклики из workspace
    return responses.filter((r) => r.vacancy.workspaceId === input.workspaceId);
  });
