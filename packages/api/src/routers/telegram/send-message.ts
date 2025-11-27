import { z } from "zod/v4";
import { db, telegramMessage, CreateTelegramMessageSchema } from "@selectio/db";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const sendMessageRouter = createTRPCRouter({
  send: protectedProcedure
    .input(
      CreateTelegramMessageSchema.extend({
        sender: z.literal("ADMIN"), // Только админ может отправлять через этот endpoint
      })
    )
    .mutation(async ({ input }) => {
      const [message] = await db
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

      // TODO: Отправить сообщение в Telegram через бота
      // await telegramBot.sendMessage(chatId, message.content);

      return message;
    }),
});
