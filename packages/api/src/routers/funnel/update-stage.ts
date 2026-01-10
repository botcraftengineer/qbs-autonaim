import { and, eq } from "@qbs-autonaim/db";
import type { response as responseTable } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const stageSchema = z.enum([
  "NEW",
  "REVIEW",
  "INTERVIEW",
  "HIRED",
  "REJECTED",
  "OFFER",
]);

type Stage = z.infer<typeof stageSchema>;

const mapStageToResponse = (
  stage: Stage,
):
  | { status: "NEW" | "EVALUATED" | "INTERVIEW" | "COMPLETED" }
  | { hrSelectionStatus: "RECOMMENDED" | "REJECTED" | "OFFER" }
  | { status: "COMPLETED"; hrSelectionStatus: "OFFER" } => {
  switch (stage) {
    case "HIRED":
      return { hrSelectionStatus: "RECOMMENDED" };
    case "REJECTED":
      return { hrSelectionStatus: "REJECTED" };
    case "OFFER":
      return { status: "COMPLETED", hrSelectionStatus: "OFFER" };
    case "INTERVIEW":
      return { status: "INTERVIEW" };
    case "REVIEW":
      return { status: "EVALUATED" };
    case "NEW":
      return { status: "NEW" };
  }
};

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      stage: stageSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
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

    const response = await ctx.db.query.response.findFirst({
      where: (
        response: typeof responseTable,
        { eq, and }: { eq: any; and: any },
      ) =>
        and(
          eq(response.id, input.candidateId),
          eq(response.entityType, "vacancy"),
        ),
      with: {
        vacancy: {
          columns: { workspaceId: true },
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
        message: "Кандидат не принадлежит вашему рабочему пространству",
      });
    }

    const updates = mapStageToResponse(input.stage);

    await ctx.db
      .update(responseTable)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(responseTable.id, input.candidateId),
          eq(responseTable.entityType, "vacancy"),
        ),
      );

    return { success: true };
  });
