import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const stageToStatusMap = {
  NEW: { status: "NEW" as const, hrSelectionStatus: null },
  REVIEW: { status: "EVALUATED" as const, hrSelectionStatus: null },
  INTERVIEW: { status: "DIALOG_APPROVED" as const, hrSelectionStatus: null },
  OFFER: { status: "COMPLETED" as const, hrSelectionStatus: "OFFER" as const },
  HIRED: { status: "COMPLETED" as const, hrSelectionStatus: "INVITE" as const },
  REJECTED: {
    status: "SKIPPED" as const,
    hrSelectionStatus: "REJECTED" as const,
  },
} as const;

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      stage: z.enum([
        "NEW",
        "REVIEW",
        "INTERVIEW",
        "OFFER",
        "HIRED",
        "REJECTED",
      ]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
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
        vacancy: {
          columns: {
            workspaceId: true,
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

    if (response.vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому кандидату",
      });
    }

    const updateData = stageToStatusMap[input.stage];

    if (!updateData) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Неверный статус",
      });
    }

    await ctx.db
      .update(vacancyResponse)
      .set(updateData)
      .where(eq(vacancyResponse.id, input.candidateId));

    return { success: true };
  });
