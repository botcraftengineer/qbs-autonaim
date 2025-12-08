import { desc } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
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
