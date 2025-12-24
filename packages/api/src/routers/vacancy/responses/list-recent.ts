import { desc, eq, workspaceRepository } from "@qbs-autonaim/db";
import {
  responseScreening,
  telegramInterviewScoring,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import z from "zod";
import { protectedProcedure } from "../../../trpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

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

    // Получаем URLs для фото
    const photoFileIds = responses
      .map((r) => r.response.photoFileId)
      .filter((id): id is string => id !== null);

    const photoFiles =
      photoFileIds.length > 0
        ? await ctx.db.query.file.findMany({
            where: (file, { inArray }) => inArray(file.id, photoFileIds),
            columns: { id: true, url: true },
          })
        : [];

    const photoUrlMap = new Map(photoFiles.map((f) => [f.id, f.url]));

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
          photoUrl: r.response.photoFileId
            ? photoUrlMap.get(r.response.photoFileId) || null
            : null,
          vacancy: r.vacancy,
          screening: screening
            ? {
                ...screening,
                analysis: screening.analysis
                  ? sanitizeHtml(screening.analysis)
                  : null,
              }
            : null,
          telegramInterviewScoring: interviewScoring
            ? {
                ...interviewScoring,
                analysis: interviewScoring.analysis
                  ? sanitizeHtml(interviewScoring.analysis)
                  : null,
              }
            : null,
        };
      }),
    );

    return responsesWithRelations;
  });
