import {
  conversation,
  conversationMessage,
  response as responseTable,
  vacancy,
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
        message: conversationMessage,
        conversation: conversation,
        response: responseTable,
        vacancy: vacancy,
      })
      .from(conversationMessage)
      .innerJoin(
        conversation,
        eq(conversationMessage.conversationId, conversation.id),
      )
      .innerJoin(responseTable, eq(conversation.responseId, responseTable.id))
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        and(
          eq(responseTable.entityType, "vacancy"),
          eq(vacancy.workspaceId, input.workspaceId),
        ),
      )
      .orderBy(desc(conversationMessage.createdAt))
      .limit(input.limit);

    return messages.map((row) => ({
      ...row.message,
      conversation: {
        ...row.conversation,
        response: {
          ...row.response,
          vacancy: row.vacancy,
        },
      },
    }));
  });
