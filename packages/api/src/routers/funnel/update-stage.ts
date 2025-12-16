import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { funnelActivity, funnelCandidate } from "@qbs-autonaim/db/schema";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const stageSchema = z.enum(["NEW", "REVIEW", "INTERVIEW", "HIRED", "REJECTED"]);

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: uuidv7Schema,
      workspaceId: workspaceIdSchema,
      stage: stageSchema,
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

    const candidate = await ctx.db.query.funnelCandidate.findFirst({
      where: eq(funnelCandidate.id, input.candidateId),
      columns: { workspaceId: true },
    });

    if (!candidate) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Кандидат не найден",
      });
    }

    if (candidate.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Candidate does not belong to your workspace",
      });
    }

    await ctx.db
      .update(funnelCandidate)
      .set({
        stage: input.stage,
        updatedAt: new Date(),
      })
      .where(eq(funnelCandidate.id, input.candidateId));

    const stageNames = {
      NEW: "Новые кандидаты",
      REVIEW: "На рассмотрении",
      INTERVIEW: "Собеседование",
      HIRED: "Наняты",
      REJECTED: "Отклонен",
    };

    await ctx.db.insert(funnelActivity).values({
      candidateId: input.candidateId,
      type: "STATUS_CHANGE",
      description: `Кандидат перемещен на этап "${stageNames[input.stage]}"`,
      author: ctx.session.user.name ?? "Пользователь",
    });

    return { success: true };
  });
