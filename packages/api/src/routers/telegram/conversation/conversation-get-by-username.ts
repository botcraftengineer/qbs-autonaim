import {
  interviewSession,
  vacancyResponse,
  vacancy as vacancyTable,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getConversationByUsernameRouter = protectedProcedure
  .input(z.object({ username: z.string(), workspaceId: workspaceIdSchema }))
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    // Search by telegramUsername in metadata
    const session = await ctx.db.query.interviewSession.findFirst({
      where: sql`${interviewSession.metadata}->>'telegramUsername' = ${input.username}`,
    });

    if (!session) {
      return null;
    }

    // Check workspace access through vacancyResponse
    if (session.vacancyResponseId) {
      const response = await ctx.db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, session.vacancyResponseId),
      });

      if (response) {
        const vacancy = await ctx.db.query.vacancy.findFirst({
          where: eq(vacancyTable.id, response.vacancyId),
          columns: { workspaceId: true },
        });

        if (!vacancy || vacancy.workspaceId !== input.workspaceId) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Нет доступа к этой беседе",
          });
        }
      }
    }

    return session;
  });
