import {
  and,
  eq,
  ilike,
  inArray,
  lt,
  or,
  workspaceRepository,
} from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const mapResponseToStage = (
  status: string,
  hrSelectionStatus: string | null,
): string => {
  if (hrSelectionStatus === "OFFER") {
    return "OFFER";
  }
  if (hrSelectionStatus === "INVITE" || hrSelectionStatus === "RECOMMENDED") {
    return "HIRED";
  }
  if (
    hrSelectionStatus === "REJECTED" ||
    hrSelectionStatus === "NOT_RECOMMENDED" ||
    status === "SKIPPED"
  ) {
    return "REJECTED";
  }
  if (status === "DIALOG_APPROVED" || status === "INTERVIEW_HH") {
    return "INTERVIEW";
  }
  if (status === "EVALUATED") {
    return "REVIEW";
  }
  return "NEW";
};

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      cursor: uuidv7Schema.optional(),
      search: z.string().optional(),
      stages: z
        .array(
          z.enum(["NEW", "REVIEW", "INTERVIEW", "OFFER", "HIRED", "REJECTED"]),
        )
        .optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    const access = await workspaceRepository.checkAccess(
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

    if (input.search) {
      const search = `%${input.search}%`;
      const matchingVacancyIds = vacancies
        .filter((v) =>
          v.title.toLowerCase().includes(input.search?.toLowerCase() ?? ""),
        )
        .map((v) => v.id);

      const searchConditions = [ilike(vacancyResponse.candidateName, search)];

      if (matchingVacancyIds.length > 0) {
        searchConditions.push(
          inArray(vacancyResponse.vacancyId, matchingVacancyIds),
        );
      }

      const searchCondition = or(...searchConditions);
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    if (input.stages && input.stages.length > 0) {
      const stageConditions = [];

      if (input.stages.includes("OFFER")) {
        stageConditions.push(eq(vacancyResponse.hrSelectionStatus, "OFFER"));
      }

      if (input.stages.includes("HIRED")) {
        stageConditions.push(
          inArray(vacancyResponse.hrSelectionStatus, ["INVITE", "RECOMMENDED"]),
        );
      }

      if (input.stages.includes("REJECTED")) {
        stageConditions.push(
          or(
            inArray(vacancyResponse.hrSelectionStatus, [
              "REJECTED",
              "NOT_RECOMMENDED",
            ]),
            eq(vacancyResponse.status, "SKIPPED"),
          ),
        );
      }

      if (input.stages.includes("INTERVIEW")) {
        stageConditions.push(
          inArray(vacancyResponse.status, ["DIALOG_APPROVED", "INTERVIEW_HH"]),
        );
      }

      if (input.stages.includes("REVIEW")) {
        stageConditions.push(eq(vacancyResponse.status, "EVALUATED"));
      }

      if (input.stages.includes("NEW")) {
        stageConditions.push(eq(vacancyResponse.status, "NEW"));
      }

      if (stageConditions.length > 0) {
        const stageCondition = or(...stageConditions);
        if (stageCondition) {
          conditions.push(stageCondition);
        }
      }
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
        telegramInterviewScoring: true,
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

      const resumeScore = r.screening?.detailedScore;
      const interviewScore = r.telegramInterviewScoring?.detailedScore;

      // Общий скор: если есть оба - среднее, иначе тот что есть
      const matchScore =
        resumeScore !== undefined && interviewScore !== undefined
          ? Math.round((resumeScore + interviewScore) / 2)
          : (resumeScore ?? interviewScore ?? 0);

      const contacts = r.contacts as Record<string, string> | null;
      // Телефон берем только из top-level поля phone
      const contactPhone = r.phone;
      // Пробуем разные варианты ключей, так как структура может варьироваться
      const email = contacts?.email || null;
      const github = contacts?.github || contacts?.gitHub || null;
      const telegram = r.telegramUsername || contacts?.telegram || null;

      // Возвращаем ID файла для получения через API
      const avatarFileId = r.photoFile?.id ?? null;

      return {
        id: r.id,
        name: r.candidateName || "Без имени",
        position: vacancyData?.title || "Неизвестная должность",
        avatarFileId: avatarFileId,
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
        matchScore,
        resumeScore,
        interviewScore,
        scoreAnalysis: r.telegramInterviewScoring?.analysis ?? undefined,
        screeningAnalysis: r.screening?.analysis ?? undefined,
        availability: "Не указано",
        salaryExpectation: "Не указано",
        stage,
        vacancyId: r.vacancyId,
        vacancyName: vacancyData?.title || "Неизвестная вакансия",
        email: email,
        phone: contactPhone,
        github: github,
        telegram: telegram,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });

    return {
      items,
      nextCursor,
    };
  });
