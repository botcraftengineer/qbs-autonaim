import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancy, vacancyResponse } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const mapResponseToStage = (
  status: string,
  hrSelectionStatus: string | null,
): string => {
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

export const getById = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      candidateId: uuidv7Schema,
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

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.candidateId),
      with: {
        screening: true,
        telegramInterviewScoring: true,
        photoFile: true,
        conversation: {
          with: {
            messages: {
              columns: { id: true },
            },
          },
        },
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    const vacancyData = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancy.id, response.vacancyId),
      columns: { id: true, title: true, workspaceId: true },
    });

    if (!vacancyData || vacancyData.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    const stage = mapResponseToStage(response.status, response.hrSelectionStatus);

    const resumeScore = response.screening?.detailedScore;
    const interviewScore = response.telegramInterviewScoring?.detailedScore;

    const matchScore =
      resumeScore !== undefined && interviewScore !== undefined
        ? Math.round((resumeScore + interviewScore) / 2)
        : (resumeScore ?? interviewScore ?? 0);

    const contacts = response.contacts as Record<string, string> | null;
    const contactPhone = response.phone;
    const email = contacts?.email || null;
    const github = contacts?.github || contacts?.gitHub || null;
    const telegram = response.telegramUsername || contacts?.telegram || null;

    const avatarFileId = response.photoFile?.id ?? null;
    const messageCount = response.conversation?.messages?.length ?? 0;

    return {
      id: response.id,
      name: response.candidateName || "Без имени",
      position: vacancyData.title || "Неизвестная должность",
      avatarFileId: avatarFileId,
      initials:
        response.candidateName
          ?.split(" ")
          .filter((n) => n.length > 0)
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2) || "??",
      experience: response.experience || "Не указан",
      location: "Не указано",
      matchScore,
      resumeScore,
      interviewScore,
      scoreAnalysis: response.telegramInterviewScoring?.analysis ?? undefined,
      screeningAnalysis: response.screening?.analysis ?? undefined,
      availability: "Не указано",
      salaryExpectation: "Не указано",
      stage,
      vacancyId: response.vacancyId,
      vacancyName: vacancyData.title || "Неизвестная вакансия",
      email: email,
      phone: contactPhone,
      github: github,
      telegram: telegram,
      resumeUrl: response.resumeUrl,
      messageCount,
      createdAt: response.createdAt,
      updatedAt: response.updatedAt,
    };
  });
