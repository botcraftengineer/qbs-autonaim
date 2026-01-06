import { eq } from "@qbs-autonaim/db";
import { gigResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const update = protectedProcedure
  .input(
    z.object({
      responseId: z.string().uuid(),
      workspaceId: workspaceIdSchema,
      candidateName: z.string().max(500).nullable().optional(),
      telegramUsername: z.string().max(100).nullable().optional(),
      phone: z.string().max(50).nullable().optional(),
      email: z.string().email().max(255).nullable().optional(),
      proposedPrice: z.number().int().positive().nullable().optional(),
      proposedCurrency: z.string().length(3).nullable().optional(),
      proposedDeliveryDays: z.number().int().positive().nullable().optional(),
      coverLetter: z.string().nullable().optional(),
      experience: z.string().nullable().optional(),
      resumeLanguage: z.string().max(10).nullable().optional(),
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

    const response = await ctx.db.query.gigResponse.findFirst({
      where: eq(gigResponse.id, input.responseId),
      with: {
        gig: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    if (response.gig.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const { responseId, workspaceId, ...updateData } = input;

    // Guard against empty updates
    if (Object.keys(updateData).length === 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Не указаны поля для обновления",
      });
    }

    const [updated] = await ctx.db
      .update(gigResponse)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(gigResponse.id, input.responseId))
      .returning();

    return updated;
  });
