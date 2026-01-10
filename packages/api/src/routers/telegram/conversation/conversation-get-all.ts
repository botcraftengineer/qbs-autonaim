import {
  conversation,
  conversationMessage,
  response as responseTable,
  vacancy,
} from "@qbs-autonaim/db";
import { workspaceIdSchema } from "@qbs-autonaim/validators";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";
import { verifyWorkspaceAccess } from "../utils";

export const getAllConversationsRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: workspaceIdSchema,
      vacancyId: z.string().optional(),
    }),
  )
  .query(async ({ input, ctx }) => {
    await verifyWorkspaceAccess(
      ctx.workspaceRepository,
      input.workspaceId,
      ctx.session.user.id,
    );

    const conversations = await ctx.db
      .select()
      .from(conversation)
      .innerJoin(responseTable, eq(conversation.responseId, responseTable.id))
      .innerJoin(vacancy, eq(responseTable.entityId, vacancy.id))
      .where(
        input.vacancyId
          ? and(
              eq(responseTable.entityType, "vacancy"),
              eq(vacancy.workspaceId, input.workspaceId),
              eq(responseTable.entityId, input.vacancyId),
            )
          : and(
              eq(responseTable.entityType, "vacancy"),
              eq(vacancy.workspaceId, input.workspaceId),
            ),
      );

    if (conversations.length === 0) {
      return [];
    }

    const conversationIds = conversations.map((c) => c.conversations.id);

    const allMessages = await ctx.db
      .select()
      .from(conversationMessage)
      .where(inArray(conversationMessage.conversationId, conversationIds))
      .orderBy(desc(conversationMessage.createdAt));

    const messagesByConversation = new Map<string, (typeof allMessages)[0]>();
    for (const msg of allMessages) {
      if (!messagesByConversation.has(msg.conversationId)) {
        messagesByConversation.set(msg.conversationId, msg);
      }
    }

    const conversationsWithMessages = conversations.map((conv) => {
      const lastMessage = messagesByConversation.get(conv.conversations.id);
      return {
        ...conv.conversations,
        messages: lastMessage ? [lastMessage] : [],
        response: {
          ...conv.responses,
          vacancy: conv.vacancies,
        },
      };
    });

    conversationsWithMessages.sort((a, b) => {
      const aLastMessage = a.messages[0];
      const bLastMessage = b.messages[0];

      if (!aLastMessage && !bLastMessage) return 0;
      if (!aLastMessage) return 1;
      if (!bLastMessage) return -1;

      return (
        bLastMessage.createdAt.getTime() - aLastMessage.createdAt.getTime()
      );
    });

    return conversationsWithMessages;
  });
