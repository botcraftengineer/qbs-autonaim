import {
  conversationMessage,
  eq,
  telegramSession,
  vacancyResponse,
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
    console.log(delayMinutes);
    //await step.sleep("human-delay", `${delayMinutes}m`);

    const result = await step.run("send-telegram-message", async () => {
      console.log("📤 Отправка сообщения в Telegram", {
        messageId,
        chatId,
      });

      try {
        // Получаем conversation через chatId в response
        const conv = await db.query.conversation.findFirst({
          where: (fields, { inArray }) => {
            return inArray(
              fields.responseId,
              db
                .select({ id: vacancyResponse.id })
                .from(vacancyResponse)
                .where(eq(vacancyResponse.chatId, chatId)),
            );
          },
          with: {
            response: {
              with: {
                vacancy: true,
              },
            },
          },
        });

        if (!conv?.response?.vacancy?.workspaceId) {
          throw new Error("Не удалось определить workspace для сообщения");
        }

        const workspaceId = conv.response.vacancy.workspaceId;

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
        if (conv.metadata) {
          try {
            const metadata = JSON.parse(conv.metadata as unknown as string);
            username = metadata.username;
          } catch (e) {
            console.warn("Не удалось распарсить metadata", e);
          }
        }

        // 2. Проверяем vacancy_response.telegramUsername
        if (!username && conv.response?.telegramUsername) {
          username = conv.response.telegramUsername;
        }

        // 3. Проверяем conversation.username
        if (!username && conv.username) {
          username = conv.username;
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

        const externalMessageId = result.messageId;

        // Обновляем lastUsedAt для сессии
        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        console.log("✅ Сообщение отправлено в Telegram", {
          messageId,
          chatId,
          externalMessageId,
          sessionId: session.id,
        });

        return { externalMessageId };
      } catch (error) {
        console.error("❌ Ошибка отправки сообщения в Telegram", {
          messageId,
          chatId,
          error,
        });
        throw error;
      }
    });

    // Обновляем запись в базе данных с externalMessageId
    const resultExternalMessageId = result.externalMessageId;

    if (messageId) {
      // Проверка на формат UUID для messageId (ID записи в БД)
      const isUuid =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          messageId,
        );

      if (isUuid) {
        await step.run("update-message-record", async () => {
          await db
            .update(conversationMessage)
            .set({
              // externalMessageId от Telegram — это строка с числом (например, "12345")
              externalMessageId: resultExternalMessageId,
            })
            .where(eq(conversationMessage.id, messageId));

          console.log("✅ Обновлена запись сообщения в БД", {
            messageId,
            externalMessageId: resultExternalMessageId,
          });
        });
      } else {
        console.warn("⚠️ Пропущен апдейт: messageId не является валидным UUID", {
          messageId,
          externalMessageId: resultExternalMessageId,
        });
      }
    }

    return {
      success: true,
      messageId,
      chatId,
      externalMessageId: resultExternalMessageId,
    };
  },
);
