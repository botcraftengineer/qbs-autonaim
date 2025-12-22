import {
  CreateMessageSchema,
  conversation,
  conversationMessage,
  eq,
  vacancyResponse,
} from "@qbs-autonaim/db";
import { inngest } from "@qbs-autonaim/jobs/client";
import { z } from "zod";
import { protectedProcedure } from "../../../trpc";

export const sendMessageRouter = protectedProcedure
  .input(
    CreateMessageSchema.extend({
      sender: z.literal("ADMIN"),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const [message] = await ctx.db
      .insert(conversationMessage)
      .values({
        conversationId: input.conversationId,
        sender: input.sender,
        contentType: input.contentType,
        content: input.content,
        fileId: input.fileId,
        voiceDuration: input.voiceDuration,
        externalMessageId: input.externalMessageId,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    const conversationData = await ctx.db
      .select({
        id: conversation.id,
        chatId: vacancyResponse.chatId,
      })
      .from(conversation)
      .innerJoin(
        vacancyResponse,
        eq(conversation.responseId, vacancyResponse.id),
      )
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
