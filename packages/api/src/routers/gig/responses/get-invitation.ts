import { and, eq } from "@qbs-autonaim/db";
import { gig, responseInvitation, response as responseTable } from "@qbs-autonaim/db/schema";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const getInvitation = protectedProcedure
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

    // Получаем отклик
    const response = await ctx.db.query.response.findFirst({
      where: and(
        eq(responseTable.id, input.responseId),
        eq(responseTable.entityType, "gig"),
      ),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    const existingGig = await ctx.db.query.gig.findFirst({
      where: and(
        eq(gig.id, response.entityId),
        eq(gig.workspaceId, input.workspaceId),
      ),
    });

    if (!existingGig) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    // Получаем приглашение
    const invitation = await ctx.db.query.responseInvitation.findFirst({
      where: eq(responseInvitation.responseId, input.responseId),
    });

    if (!invitation) {
      return null;
    }

    return {
      id: invitation.id,
      invitationText: invitation.invitationText,
      interviewUrl: invitation.interviewUrl,
      createdAt: invitation.createdAt,
    };
  });
