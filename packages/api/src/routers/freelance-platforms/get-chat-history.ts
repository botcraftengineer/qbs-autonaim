import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure } from "../../trpc";

const getChatHistoryInputSchema = z.object({
  conversationId: z.string().uuid(),
});

export const getChatHistory = publicProcedure
  .input(getChatHistoryInputSchema)
  .query(async ({ input, ctx }) => {
    // Проверяем существование conversation
    const conv = await ctx.db.query.conversation.findFirst({
      where: (conversation, { eq, and }) =>
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.source, "WEB"),
        ),
      with: {
        messages: {
          orderBy: (messages, { asc }) => [asc(messages.createdAt)],
        },
      },
    });

    if (!conv) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Разговор не найден",
      });
    }

    // Форматируем сообщения для клиента
    const messages = conv.messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender,
      content: msg.content,
      contentType: msg.contentType,
      createdAt: msg.createdAt,
    }));

    return {
      conversationId: conv.id,
      status: conv.status,
      messages,
    };
  });
