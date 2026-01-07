import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getNewMessagesInputSchema = z.object({
  conversationId: z.uuid(),
  lastMessageId: z.uuid().optional(),
});

export const getNewMessages = publicProcedure
  .input(getNewMessagesInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем существование conversation
    const conv = await ctx.db.query.conversation.findFirst({
      where: (conversation, { eq, and }) =>
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.source, "WEB"),
        ),
    });

    if (!conv) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Разговор не найден",
      });
    }

    // Получаем новые сообщения от бота
    const messages = await ctx.db.query.conversationMessage.findMany({
      where: (message, { eq, and, gt }) => {
        const conditions = [
          eq(message.conversationId, input.conversationId),
          eq(message.sender, "BOT"),
        ];

        if (input.lastMessageId) {
          conditions.push(gt(message.id, input.lastMessageId));
        }

        return and(...conditions);
      },
      orderBy: (messages, { asc }) => [asc(messages.createdAt)],
      limit: 10,
    });

    return {
      messages: messages.map((msg) => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        contentType: msg.contentType,
        createdAt: msg.createdAt,
      })),
    };
  });
