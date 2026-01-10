import {
  chatEntityTypeEnum,
  chatMessage,
  chatSession,
} from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const clearHistory = protectedProcedure
  .input(
    z.object({
      entityType: z.enum(chatEntityTypeEnum.enumValues),
      entityId: z.string().uuid(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    const { entityType, entityId } = input;
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
        success: true,
      };
    }

    // Удаление сообщений
    await ctx.db
      .delete(chatMessage)
      .where(eq(chatMessage.sessionId, session.id));

    // Сброс счетчика
    await ctx.db
      .update(chatSession)
      .set({
        messageCount: 0,
        lastMessageAt: null,
      })
      .where(eq(chatSession.id, session.id));

    return {
      success: true,
    };
  });
