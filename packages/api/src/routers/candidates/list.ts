import {
  and,
  count,
  eq,
  ilike,
  inArray,
  lt,
  or,
  workspaceRepository,
} from "@qbs-autonaim/db";
import {
  conversation,
  conversationMessage,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const mapResponseToStage = (
  status: string,
  hrSelectionStatus: string | null,
): string => {
  // Маппинг на новые стадии воронки
  if (hrSelectionStatus === "ONBOARDING") {
    return "ONBOARDING";
  }
  if (hrSelectionStatus === "CONTRACT_SENT") {
    return "CONTRACT_SENT";
  }
  if (hrSelectionStatus === "SECURITY_PASSED") {
    return "SECURITY_PASSED";
  }
  if (hrSelectionStatus === "OFFER") {
    return "OFFER_SENT";
  }
  if (hrSelectionStatus === "INVITE" || hrSelectionStatus === "RECOMMENDED") {
    return "OFFER_SENT";
  }
  if (
    hrSelectionStatus === "REJECTED" ||
    hrSelectionStatus === "NOT_RECOMMENDED" ||
    status === "SKIPPED"
  ) {
    return "REJECTED";
  }
  if (status === "EVALUATED") {
    return "CHAT_INTERVIEW";
  }
  return "SCREENING_DONE";
};

export const list = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
      limit: z.number().int().min(1).max(200).default(100),
      cursor: uuidv7Schema.optional(),
      search: z.string().optional(),
      stages: z
        .array(
          z.enum([
            "SCREENING_DONE",
            "CHAT_INTERVIEW",
            "OFFER_SENT",
            "SECURITY_PASSED",
            "CONTRACT_SENT",
            "ONBOARDING",
            "REJECTED",
          ]),
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

      if (input.stages.includes("ONBOARDING")) {
        stageConditions.push(
          inArray(vacancyResponse.hrSelectionStatus, ["INVITE", "RECOMMENDED"]),
        );
      }

      if (input.stages.includes("OFFER_SENT")) {
        stageConditions.push(eq(vacancyResponse.hrSelectionStatus, "OFFER"));
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

      if (input.stages.includes("CHAT_INTERVIEW")) {
        stageConditions.push(eq(vacancyResponse.status, "EVALUATED"));
      }

      if (input.stages.includes("SCREENING_DONE")) {
        stageConditions.push(eq(vacancyResponse.status, "NEW"));
      }

      if (input.stages.includes("SECURITY_PASSED")) {
        stageConditions.push(
          eq(vacancyResponse.hrSelectionStatus, "SECURITY_PASSED"),
        );
      }

      if (input.stages.includes("CONTRACT_SENT")) {
        stageConditions.push(
          eq(vacancyResponse.hrSelectionStatus, "CONTRACT_SENT"),
        );
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

    // Подсчитываем общее количество для пагинации
    const totalCount = await ctx.db.query.vacancyResponse.findMany({
      where: and(...conditions),
      columns: { id: true },
    });

    const responses = await ctx.db.query.vacancyResponse.findMany({
      where: and(...conditions),
      orderBy: (responses, { desc }) => [desc(responses.id)],
      limit: input.limit + 1,
      with: {
        screening: {
          columns: { detailedScore: true },
        },
        telegramInterviewScoring: {
          columns: { detailedScore: true },
        },
        photoFile: {
          columns: { id: true },
        },
        conversation: {
          columns: { id: true },
          with: {
            messages: {
              columns: { id: true },
            },
          },
        },
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

      const matchScore =
        resumeScore !== undefined && interviewScore !== undefined
          ? Math.round((resumeScore + interviewScore) / 2)
          : (resumeScore ?? interviewScore ?? 0);

      const contacts = r.contacts as Record<string, string> | null;
      const telegram = r.telegramUsername || contacts?.telegram || null;
      const email = contacts?.email || null;
      const avatarFileId = r.photoFile?.id ?? null;
      const messageCount = r.conversation?.messages?.length ?? 0;

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
        matchScore,
        stage,
        email: email,
        phone: r.phone,
        telegram: telegram,
        messageCount,
      };
    });

    return {
      items,
      nextCursor,
      total: totalCount.length,
    };
  });
