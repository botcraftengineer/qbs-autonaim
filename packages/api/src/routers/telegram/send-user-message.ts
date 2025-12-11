import { db, eq, telegramSession } from "@qbs-autonaim/db";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

/**
 * Отправить сообщение через пользовательскую сессию Telegram
 */
export const sendUserMessageRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      sessionId: z.string().optional(), // Если не указан, берем последнюю активную
      username: z.string(),
      text: z.string().min(1),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      // Получаем сессию
      const session = input.sessionId
        ? await db.query.telegramSession.findFirst({
            where: eq(telegramSession.id, input.sessionId),
          })
        : await db.query.telegramSession.findFirst({
            where: eq(telegramSession.workspaceId, input.workspaceId),
            orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
          });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Telegram сессия не найдена. Пожалуйста, авторизуйтесь.",
        });
      }

      // Отправляем сообщение через SDK
      const result = await tgClientSDK.sendMessageByUsername({
        workspaceId: input.workspaceId,
        username: input.username,
        text: input.text,
      });

      // Обновляем lastUsedAt
      await db
        .update(telegramSession)
        .set({ lastUsedAt: new Date() })
        .where(eq(telegramSession.id, session.id));

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось отправить сообщение",
      });
    }
  });

/**
 * Отправить сообщение по номеру телефона через пользовательскую сессию
 */
export const sendUserMessageByPhoneRouter = protectedProcedure
  .input(
    z.object({
      workspaceId: z.string(),
      sessionId: z.string().optional(),
      phone: z.string(),
      text: z.string().min(1),
      firstName: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    try {
      // Получаем сессию
      const session = input.sessionId
        ? await db.query.telegramSession.findFirst({
            where: eq(telegramSession.id, input.sessionId),
          })
        : await db.query.telegramSession.findFirst({
            where: eq(telegramSession.workspaceId, input.workspaceId),
            orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
          });

      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Telegram сессия не найдена. Пожалуйста, авторизуйтесь.",
        });
      }

      // Отправляем сообщение через SDK
      const result = await tgClientSDK.sendMessageByPhone({
        workspaceId: input.workspaceId,
        phone: input.phone,
        text: input.text,
        firstName: input.firstName,
      });

      // Обновляем lastUsedAt
      await db
        .update(telegramSession)
        .set({ lastUsedAt: new Date() })
        .where(eq(telegramSession.id, session.id));

      return result;
    } catch (error) {
      console.error("❌ Ошибка отправки сообщения по телефону:", error);
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Не удалось отправить сообщение",
      });
    }
  });
