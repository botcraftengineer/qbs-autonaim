import {
  CreateTelegramMessageSchema,
  eq,
  telegramConversation,
  telegramMessage,
} from "@qbs-autonaim/db";
import { inngest } from "@qbs-autonaim/jobs/client";
import { uuidv7Schema } from "@qbs-autonaim/validators";
import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sendMessageRouter = {
  send: protectedProcedure
    .input(
      CreateTelegramMessageSchema.extend({
        sender: z.literal("ADMIN"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [message] = await ctx.db
        .insert(telegramMessage)
        .values({
          conversationId: input.conversationId,
          sender: input.sender,
          contentType: input.contentType,
          content: input.content,
          fileId: input.fileId,
          voiceDuration: input.voiceDuration,
          telegramMessageId: input.telegramMessageId,
        })
        .returning();

      if (!message) {
        throw new Error("Failed to create message");
      }

      const conversation = await ctx.db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.id, input.conversationId),
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      await inngest.send({
        name: "telegram/message.send",
        data: {
          messageId: message.id,
          chatId: conversation.chatId,
          content: message.content,
        },
      });

      return message;
    }),

  mutate: protectedProcedure
    .input(
      z.object({
        conversationId: uuidv7Schema,
        text: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const [message] = await ctx.db
        .insert(telegramMessage)
        .values({
          conversationId: input.conversationId,
          sender: "ADMIN",
          contentType: "TEXT",
          content: input.text,
        })
        .returning();

      if (!message) {
        throw new Error("Failed to create message");
      }

      const conversation = await ctx.db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.id, input.conversationId),
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }

      await inngest.send({
        name: "telegram/message.send",
        data: {
          messageId: message.id,
          chatId: conversation.chatId,
          content: message.content,
        },
      });

      return message;
    }),
} satisfies TRPCRouterRecord;
