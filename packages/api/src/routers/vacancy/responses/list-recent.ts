import { and, desc, eq } from "@qbs-autonaim/db";
import {
  interviewScoring,
  responseScreening,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db/schema";
import { getFileUrl } from "@qbs-autonaim/lib/s3";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { sanitizeHtml } from "../../utils/sanitize-html";

export const listRecent = protectedProcedure
  .input(z.object({ workspaceId: workspaceIdSchema }))
  .query(async ({ ctx, input }) => {
    // Проверка доступа к workspace
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

    const responses = await ctx.db
      .select({
        response: responseTable,
        vacancy: vacancy,
      })
      .from(responseTable)
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(responseTable.createdAt))
      .limit(5);

    // Получаем URLs для фото
    const photoFileIds = responses
      .map((r) => r.response.photoFileId)
      .filter((id): id is string => id !== null);

    const photoFiles =
      photoFileIds.length > 0
        ? await ctx.db.query.file.findMany({
            where: (file, { inArray }) => inArray(file.id, photoFileIds),
            columns: { id: true, key: true },
          })
        : [];

    const photoUrlMap = new Map(
      photoFiles.map((f) => [f.id, getFileUrl(f.key)]),
    );

    // Получаем screening и interviewScoring для каждого отклика
    const responsesWithRelations = await Promise.all(
      responses.map(async (r) => {
        const screening = await ctx.db.query.responseScreening.findFirst({
          where: eq(responseScreening.responseId, r.response.id),
          orderBy: desc(responseScreening.updatedAt),
        });

        const scoring = await ctx.db.query.interviewScoring.findFirst({
          where: eq(interviewScoring.responseId, r.response.id),
          orderBy: desc(interviewScoring.createdAt),
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
          interviewScoring: scoring
            ? {
                ...scoring,
                analysis: scoring.analysis
                  ? sanitizeHtml(scoring.analysis)
                  : null,
              }
            : null,
        };
      }),
    );

    return responsesWithRelations;
  });
