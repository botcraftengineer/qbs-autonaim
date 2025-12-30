import { and, eq } from "@qbs-autonaim/db";
import {
  gig,
  gigHrSelectionStatusValues,
  gigResponse,
  gigResponseStatusValues,
} from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const updateStatus = protectedProcedure
  .input(
    z.object({
      responseId: z.string(),
      workspaceId: workspaceIdSchema,
      status: z.enum(gigResponseStatusValues).optional(),
      hrSelectionStatus: z.enum(gigHrSelectionStatusValues).optional(),
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

    const patch: {
      status?: (typeof gigResponseStatusValues)[number];
      hrSelectionStatus?: (typeof gigHrSelectionStatusValues)[number];
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (input.status !== undefined) {
      patch.status = input.status;
    }
    if (input.hrSelectionStatus !== undefined) {
      patch.hrSelectionStatus = input.hrSelectionStatus;
    }

    const [updated] = await ctx.db
      .update(gigResponse)
      .set(patch)
      .where(eq(gigResponse.id, input.responseId))
      .returning();

    return updated;
  });
