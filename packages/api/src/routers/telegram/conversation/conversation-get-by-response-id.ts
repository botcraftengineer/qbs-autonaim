import {
  interviewSession,
  vacancyResponse,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
import { uuidv7Schema, workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByResponseIdRouter = protectedProcedure
  .input(z.object({ responseId: uuidv7Schema, workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const response = await ctx.db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, input.responseId),
    });

    if (!response) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Отклик не найден",
      });
    }

    // Check workspace access
    const vacancy = await ctx.db.query.vacancy.findFirst({
      where: eq(vacancyTable.id, response.vacancyId),
      columns: { workspaceId: true },
    });

    if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Нет доступа к этому отклику",
      });
    }

    const session = await ctx.db.query.interviewSession.findFirst({
      where: eq(interviewSession.vacancyResponseId, input.responseId),
    });

    return session;
  });
