import {
  CreateTelegramMessageSchema,
  eq,
  telegramConversation,
  telegramMessage,
  vacancyResponse,
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

      const conversationData = await ctx.db
        .select({
          id: telegramConversation.id,
          chatId: vacancyResponse.chatId,
        })
        .from(telegramConversation)
        .innerJoin(
          vacancyResponse,
          eq(telegramConversation.responseId, vacancyResponse.id),
        )
        .where(eq(telegramConversation.id, input.conversationId))
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

      const conversationData = await ctx.db
        .select({
          id: telegramConversation.id,
          chatId: vacancyResponse.chatId,
        })
        .from(telegramConversation)
        .innerJoin(
          vacancyResponse,
          eq(telegramConversation.responseId, vacancyResponse.id),
        )
        .where(eq(telegramConversation.id, input.conversationId))
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
    }),
} satisfies TRPCRouterRecord;
