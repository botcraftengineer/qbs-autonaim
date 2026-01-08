import { eq } from "@qbs-autonaim/db";
import { gigResponse } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const get = protectedProcedure
  .input(
    z.object({
      responseId: z.uuid(),
      workspaceId: workspaceIdSchema,
    }),
  )
  .query(async ({ ctx, input }) => {
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
        screening: true,
        gig: true,
        interviewScoring: true,
      },
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Проверяем что gig принадлежит workspace
    if (response.gig.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    return response;
  });
