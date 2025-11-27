import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, telegramConversation } from "@selectio/db";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const getConversationRouter = createTRPCRouter({
  getByResponseId: protectedProcedure
    .input(z.object({ responseId: z.string().uuid() }))
    .query(async ({ input }) => {
      // TODO: Связать conversation с response через metadata или отдельную таблицу
      // Пока возвращаем первую активную беседу
      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.status, "ACTIVE"),
      });

      return conversation;
    }),

  getByChatId: protectedProcedure
    .input(z.object({ chatId: z.string() }))
    .query(async ({ input }) => {
      const conversation = await db.query.telegramConversation.findFirst({
        where: eq(telegramConversation.chatId, input.chatId),
      });

      return conversation;
    }),
});
