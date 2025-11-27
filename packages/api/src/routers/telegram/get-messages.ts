import { desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import { db, telegramMessage } from "@selectio/db";
import { createTRPCRouter, protectedProcedure } from "../../trpc";

export const getMessagesRouter = createTRPCRouter({
  getByConversationId: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .query(async ({ input }) => {
      const messages = await db.query.telegramMessage.findMany({
        where: eq(telegramMessage.conversationId, input.conversationId),
        orderBy: [telegramMessage.createdAt],
        with: {
          file: true,
        },
      });

      return messages;
    }),

  getRecent: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const messages = await db.query.telegramMessage.findMany({
        orderBy: [desc(telegramMessage.createdAt)],
        limit: input.limit,
        with: {
          conversation: true,
        },
      });

      return messages;
    }),
});
