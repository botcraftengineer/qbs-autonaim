import { and, eq } from "@qbs-autonaim/db";
import { gig, UpdateGigSettingsSchema } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      gigId: z.uuid(),
      workspaceId: workspaceIdSchema,
      settings: UpdateGigSettingsSchema,
    }),
  )
  .mutation(async ({ ctx, input }) => {
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

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, input.gigId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    const patch: {
      customBotInstructions?: string | null;
      customScreeningPrompt?: string | null;
      customInterviewQuestions?: string | null;
      interviewMediaFileIds?: string[] | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.settings.customBotInstructions !== undefined) {
      patch.customBotInstructions = input.settings.customBotInstructions;
    }
    if (input.settings.customScreeningPrompt !== undefined) {
      patch.customScreeningPrompt = input.settings.customScreeningPrompt;
    }
    if (input.settings.customInterviewQuestions !== undefined) {
      patch.customInterviewQuestions = input.settings.customInterviewQuestions;
    }
    if (input.settings.interviewMediaFileIds !== undefined) {
      patch.interviewMediaFileIds = input.settings.interviewMediaFileIds;
    }

    const result = await ctx.db
      .update(gig)
      .set(patch)
      .where(
        and(eq(gig.id, input.gigId), eq(gig.workspaceId, input.workspaceId)),
      )
      .returning();

    if (!result[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Задание не найдено",
      });
    }

    return result[0];
  });
