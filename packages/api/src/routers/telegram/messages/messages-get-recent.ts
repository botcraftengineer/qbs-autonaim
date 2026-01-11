import {
  interviewMessage,
  interviewSession,
  vacancy,
  response as responseTable,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getRecentMessagesRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      limit: z.number().min(1).max(100).default(10),
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const messages = await ctx.db
      .select({
        message: interviewMessage,
        session: interviewSession,
        response: response,
        vacancy: vacancy,
      })
      .from(interviewMessage)
      .innerJoin(
        interviewSession,
        eq(interviewMessage.sessionId, interviewSession.id),
      )
      .innerJoin(
        response,
        eq(interviewSession.responseId, response.id),
      )
      .innerJoin(vacancy, eq(response.entityId, vacancy.id))
      .where(
        and(
          eq("vacancy_response"),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(interviewMessage.createdAt))
      .limit(input.limit);

    return messages.map((row) => ({
      ...row.message,
      session: {
        ...row.session,
        response: {
          ...row.response,
          vacancy: row.vacancy,
        },
      },
    }));
  });
