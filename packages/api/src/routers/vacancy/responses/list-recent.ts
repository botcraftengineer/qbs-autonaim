import { desc, eq, workspaceRepository } from "@selectio/db";
import {
  responseScreening,
  telegramInterviewScoring,
  vacancy,
  vacancyResponse,
} from "@selectio/db/schema";
import { workspaceIdSchema } from "@selectio/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const listRecent = protectedProcedure
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

    const responses = await ctx.db
      .select({
        response: vacancyResponse,
        vacancy: vacancy,
      })
      .from(vacancyResponse)
      .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
      .where(eq(vacancy.workspaceId, input.workspaceId))
      .orderBy(desc(vacancyResponse.createdAt))
      .limit(5);

    // Получаем screening и telegramInterviewScoring для каждого отклика
    const responsesWithRelations = await Promise.all(
      responses.map(async (r) => {
        const screening = await ctx.db.query.responseScreening.findFirst({
          where: eq(responseScreening.responseId, r.response.id),
        });

        const interviewScoring =
          await ctx.db.query.telegramInterviewScoring.findFirst({
            where: eq(telegramInterviewScoring.responseId, r.response.id),
          });

        return {
          ...r.response,
          vacancy: r.vacancy,
          screening,
          telegramInterviewScoring: interviewScoring,
        };
      }),
    );

    return responsesWithRelations;
  });
