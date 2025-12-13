import {
  eq,
  telegramConversation,
  telegramMessage,
  telegramSession,
} from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

/**
 * Inngest функция для отправки сообщения в Telegram
 */
export const sendTelegramMessageFunction = inngest.createFunction(
  {
    id: "send-telegram-message",
    name: "Send Telegram Message",
    retries: 0,
  },
  { event: "telegram/message.send" },
  async ({ event, step }) => {
    const { messageId, chatId, content } = event.data;

    // Задержка 3-5 минут для имитации живого человека
    const delayMinutes = Math.floor(Math.random() * 3) + 3; // 3-5 минут
    await step.sleep("human-delay", `${delayMinutes}m`);

    const result = await step.run("send-telegram-message", async () => {
      console.log("📤 Отправка сообщения в Telegram", {
        messageId,
        chatId,
      });

      try {
        // Получаем conversation
        const conversation = await db.query.telegramConversation.findFirst({
          where: eq(telegramConversation.chatId, chatId),
          with: {
            response: {
              with: {
                vacancy: true,
              },
            },
          },
        });

        if (!conversation?.response?.vacancy?.workspaceId) {
          throw new Error("Не удалось определить workspace для сообщения");
        }

        const workspaceId = conversation.response.vacancy.workspaceId;

        // Получаем активную сессию для workspace
        const session = await db.query.telegramSession.findFirst({
          where: eq(telegramSession.workspaceId, workspaceId),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });

        if (!session) {
          throw new Error(
            `Нет активной Telegram сессии для workspace ${workspaceId}`,
          );
        }

        // Пытаемся получить username из разных источников в порядке приоритета
        let username: string | undefined;

        // 1. Проверяем metadata
        if (conversation.metadata) {
          try {
            const metadata = JSON.parse(conversation.metadata);
            username = metadata.username;
          } catch (e) {
            console.warn("Не удалось распарсить metadata", e);
          }
        }

        // 2. Проверяем vacancy_response.telegramUsername
        if (!username && conversation.response?.telegramUsername) {
          username = conversation.response.telegramUsername;
        }

        // 3. Проверяем conversation.username
        if (!username && conversation.username) {
          username = conversation.username;
        }

        // Отправляем сообщение через SDK
        let result: {
          success: boolean;
          messageId: string;
          chatId: string;
        };

        if (username) {
          // Отправка по username
          console.log(`📨 Отправка по username: @${username}`);
          result = await tgClientSDK.sendMessageByUsername({
            workspaceId,
            username,
            text: content,
          });
        } else {
          // Fallback: отправка по chatId
          console.log(`📨 Отправка по chatId: ${chatId}`);
          result = await tgClientSDK.sendMessage({
            workspaceId,
            chatId: Number.parseInt(chatId, 10),
            text: content,
          });
        }

        const telegramMessageId = result.messageId;

        // Обновляем lastUsedAt для сессии
        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        console.log("✅ Сообщение отправлено в Telegram", {
          messageId,
          chatId,
          telegramMessageId,
          sessionId: session.id,
        });

        return { telegramMessageId };
      } catch (error) {
        console.error("❌ Ошибка отправки сообщения в Telegram", {
          messageId,
          chatId,
          error,
        });
        throw error;
      }
    });

    // Обновляем запись в базе данных с telegramMessageId
    await step.run("update-message-record", async () => {
      await db
        .update(telegramMessage)
        .set({
          telegramMessageId: result.telegramMessageId,
        })
        .where(eq(telegramMessage.id, messageId));

      console.log("✅ Обновлена запись сообщения в БД", {
        messageId,
        telegramMessageId: result.telegramMessageId,
      });
    });

    return {
      success: true,
      messageId,
      chatId,
      telegramMessageId: result.telegramMessageId,
    };
  },
);
