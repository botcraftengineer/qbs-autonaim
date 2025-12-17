import { eq, workspaceRepository } from "@qbs-autonaim/db";
import { vacancyResponse } from "@qbs-autonaim/db/schema";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sendOffer = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      candidateId: z.string(),
      offerDetails: z
        .object({
          position: z.string().optional(),
          salary: z.string().optional(),
          startDate: z.string().optional(),
          benefits: z.string().optional(),
          message: z.string().optional(),
        })
        .optional(),
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
        vacancy: true,
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

    await ctx.db
      .update(vacancyResponse)
      .set({
        hrSelectionStatus: "OFFER",
        updatedAt: new Date(),
      })
      .where(eq(vacancyResponse.id, input.candidateId));

    return {
      success: true,
      candidateId: input.candidateId,
    };
  });
