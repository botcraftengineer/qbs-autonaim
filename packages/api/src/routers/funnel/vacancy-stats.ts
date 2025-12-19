import { eq, inArray } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { mapResponseToStage } from "./map-response-stage";

export const vacancyStats = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
    });

    const workspaceVacancyIds = new Set(vacancies.map((v) => v.id));

    if (input.vacancyId && !workspaceVacancyIds.has(input.vacancyId)) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Вакансия не найдена в указанном workspace",
      });
    }

    const vacancyIds = input.vacancyId
      ? [input.vacancyId]
      : Array.from(workspaceVacancyIds);

    if (vacancyIds.length === 0) {
      return [];
    }

    const responses = await ctx.db.query.vacancyResponse.findMany({
      where: inArray(vacancyResponse.vacancyId, vacancyIds),
    });

    const statsByVacancy = new Map<
      string,
      {
        vacancyId: string;
        vacancyName: string;
        total: number;
        inProcess: number;
        hired: number;
        rejected: number;
      }
    >();

    for (const response of responses) {
      const vacancyData = vacancies.find((v) => v.id === response.vacancyId);
      const vacancyName = vacancyData?.title ?? "Неизвестная вакансия";

      const stage = mapResponseToStage(
        response.status,
        response.hrSelectionStatus,
      );
      const isHired = stage === "HIRED";
      const isRejected = stage === "REJECTED";

      const existing = statsByVacancy.get(response.vacancyId);

      if (existing) {
        existing.total++;
        if (isHired) {
          existing.hired++;
        } else if (isRejected) {
          existing.rejected++;
        } else {
          existing.inProcess++;
        }
      } else {
        statsByVacancy.set(response.vacancyId, {
          vacancyId: response.vacancyId,
          vacancyName,
          total: 1,
          inProcess: !isHired && !isRejected ? 1 : 0,
          hired: isHired ? 1 : 0,
          rejected: isRejected ? 1 : 0,
        });
      }
    }

    return Array.from(statsByVacancy.values()).sort(
      (a, b) => b.total - a.total,
    );
  });
