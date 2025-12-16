import { eq } from "@qbs-autonaim/db";
import { funnelActivity, funnelCandidate } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

const stageSchema = z.enum(["NEW", "REVIEW", "INTERVIEW", "HIRED", "REJECTED"]);

export const updateStage = protectedProcedure
  .input(
    z.object({
      candidateId: z.string().uuid(),
      stage: stageSchema,
    }),
  )
  .mutation(async ({ input, ctx }) => {
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
