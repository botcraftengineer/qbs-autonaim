import {
  eq,
  interviewMessage,
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
        // Получаем vacancyResponse по chatId
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.chatId, chatId),
          with: {
            vacancy: true,
          },
        });

        if (!response?.vacancy?.workspaceId) {
          throw new Error("Не удалось определить workspace для сообщения");
        }

        const workspaceId = response.vacancy.workspaceId;

        // Получаем interviewSession для метаданных
        const session = await db.query.interviewSession.findFirst({
          where: (fields, { and, eq }) =>
            and(
              eq(fields.entityType, "vacancy_response"),
              eq(fields.vacancyResponseId, response.id),
            ),
        });

        // Получаем активную Telegram сессию для workspace
        const tgSession = await db.query.telegramSession.findFirst({
          where: eq(telegramSession.workspaceId, workspaceId),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });

        if (!tgSession) {
          throw new Error(
            `Нет активной Telegram сессии для workspace ${workspaceId}`,
          );
        }

        // Пытаемся получить username из разных источников в порядке приоритета
        let username: string | undefined;

        // 1. Проверяем metadata chatSession
        if (session?.metadata) {
          const metadata = session.metadata as Record<string, unknown>;
          username = metadata.username as string | undefined;
        }

        // 2. Проверяем vacancy_response.telegramUsername
        if (!username && response.telegramUsername) {
          username = response.telegramUsername;
        }

        // Отправляем сообщение через SDK
        let sendResult: {
          success: boolean;
          messageId: string;
          chatId: string;
        };

        if (username) {
          // Отправка по username
          console.log(`📨 Отправка по username: @${username}`);
          sendResult = await tgClientSDK.sendMessageByUsername({
            workspaceId,
            username,
            text: content,
          });
        } else {
          // Fallback: отправка по chatId
          console.log(`📨 Отправка по chatId: ${chatId}`);
          sendResult = await tgClientSDK.sendMessage({
            workspaceId,
            chatId: Number.parseInt(chatId, 10),
            text: content,
          });
        }

        const externalMessageId = sendResult.messageId;

        // Обновляем lastUsedAt для сессии
        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, tgSession.id));

        console.log("✅ Сообщение отправлено в Telegram", {
          messageId,
          chatId,
          externalMessageId,
          sessionId: tgSession.id,
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
            .update(interviewMessage)
            .set({
              // externalId от Telegram — это строка с числом (например, "12345")
              externalId: resultExternalMessageId,
            })
            .where(eq(interviewMessage.id, messageId));

          console.log("✅ Обновлена запись сообщения в БД", {
            messageId,
            externalId: resultExternalMessageId,
          });
        });
      } else {
        console.warn("⚠️ Пропущен апдейт: messageId не является валидным UUID", {
          messageId,
          externalId: resultExternalMessageId,
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
