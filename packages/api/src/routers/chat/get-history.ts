import { chatEntityTypeEnum } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const getHistory = protectedProcedure
  .input(
    z.object({
      entityType: z.enum(chatEntityTypeEnum.enumValues),
      entityId: z.string().uuid(),
      limit: z.number().min(1).max(50).default(50),
    }),
  )
  .query(async ({ input, ctx }) => {
    const { entityType, entityId, limit } = input;
    const userId = ctx.session.user.id;

    // TODO: Проверка доступа к сущности

    // Загрузка сессии
    const session = await ctx.db.query.chatSession.findFirst({
      where: (chatSession, { and, eq }) =>
        and(
          eq(chatSession.entityType, entityType),
          eq(chatSession.entityId, entityId),
          eq(chatSession.userId, userId),
        ),
    });

    if (!session) {
      return {
        messages: [],
        hasMore: false,
      };
    }

    // Загрузка сообщений
    const messages = await ctx.db.query.chatMessage.findMany({
      where: (chatMessage, { eq }) => eq(chatMessage.sessionId, session.id),
      orderBy: (chatMessage, { desc }) => [desc(chatMessage.createdAt)],
      limit: limit + 1,
    });

    const hasMore = messages.length > limit;
    const resultMessages = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: resultMessages.reverse().map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        quickReplies: msg.quickReplies ?? undefined,
        metadata: msg.metadata ?? undefined,
        createdAt: msg.createdAt,
      })),
      hasMore,
    };
  });
