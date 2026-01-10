import {
  conversation,
  conversationMessage,
  eq,
  response as responseTable,
} from "@qbs-autonaim/db";
import { inngest } from "@qbs-autonaim/jobs/client";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendMutateRouter = protectedProcedure
  .input(
    z.object({
      conversationId: uuidv7Schema,
      text: z.string().min(1),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const [message] = await ctx.db
      .insert(conversationMessage)
      .values({
        conversationId: input.conversationId,
        sender: "ADMIN",
        contentType: "TEXT",
        channel: "WEB",
        content: input.text,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    const conversationData = await ctx.db
      .select({
        id: conversation.id,
        chatId: responseTable.chatId,
      })
      .from(conversation)
      .innerJoin(responseTable, eq(conversation.responseId, responseTable.id))
      .where(eq(conversation.id, input.conversationId))
      .limit(1);

    if (!conversationData[0] || !conversationData[0].chatId) {
      throw new Error("Conversation or chatId not found");
    }

    await inngest.send({
      name: "telegram/message.send",
      data: {
        messageId: message.id,
        chatId: conversationData[0].chatId,
        content: message.content,
      },
    });

    return message;
  });
