import { and, desc, eq, inArray, lt } from "@qbs-autonaim/db";
import { response as responseTable, vacancy } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { mapResponseToStage } from "./map-response-stage";

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: uuidv7Schema.optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await ctx.workspaceRepository.checkAccess(
      input.workspaceId,
      ctx.session.user.id,
    );

    if (!access) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к workspace",
      });
    }

    const vacancies = await ctx.db.query.vacancy.findMany({
      where: eq(vacancy.workspaceId, input.workspaceId),
      columns: { id: true, title: true },
    });

    const vacancyIds = vacancies.map((v) => v.id);

    if (vacancyIds.length === 0) {
      return {
        items: [],
        nextCursor: undefined,
      };
    }

    const conditions = [inArray(vacancyResponse.vacancyId, vacancyIds)];

    if (input.vacancyId) {
      conditions.push(eq(vacancyResponse.vacancyId, input.vacancyId));
    }

    if (input.cursor) {
      conditions.push(lt(vacancyResponse.id, input.cursor));
    }

    const responses = await ctx.db.query.vacancyResponse.findMany({
      where: and(...conditions),
      orderBy: (responses, { desc }) => [desc(responses.id)],
      limit: input.limit + 1,
      with: {
        screening: true,
        interviewScoring: true,
        photoFile: true,
      },
    });

    let nextCursor: string | undefined;
    if (responses.length > input.limit) {
      const nextItem = responses.pop();
      nextCursor = nextItem?.id;
    }

    const items = responses.map((r) => {
      const vacancyData = vacancies.find((v) => v.id === r.vacancyId);
      const stage = mapResponseToStage(r.status, r.hrSelectionStatus);

      return {
        id: r.id,
        name: r.candidateName || "Без имени",
        position: vacancyData?.title || "Неизвестная должность",
        avatar: null,
        avatarFileId: r.photoFile?.id ?? null,
        initials:
          r.candidateName
            ?.split(" ")
            .filter((n) => n.length > 0)
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "??",
        experience: r.experience || "Не указан",
        location: "Не указано",
        skills: [],
        matchScore: r.screening?.detailedScore || 0,
        resumeScore: r.screening?.detailedScore,
        interviewScore: r.interviewScoring?.detailedScore,
        scoreAnalysis: r.interviewScoring?.analysis ?? undefined,
        availability: "Не указано",
        salaryExpectation: "Не указано",
        stage,
        status: r.status,
        hrSelectionStatus: r.hrSelectionStatus,
        vacancyId: r.vacancyId,
        vacancyName: vacancyData?.title || "Неизвестная вакансия",
        email: null,
        phone: r.phone,
        telegram: r.telegramUsername,
        github: null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
    };
  });
