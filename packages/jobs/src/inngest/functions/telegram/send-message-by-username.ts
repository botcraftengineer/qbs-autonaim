import { telegramSession } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

/**
 * Inngest функция для отправки сообщения по username
 * Не требует chatId и messageId, работает только с username
 */
export const sendTelegramMessageByUsernameFunction = inngest.createFunction(
  {
    id: "send-telegram-message-by-username",
    name: "Send Telegram Message By Username",
    retries: 0,
  },
  { event: "telegram/message.send.by-username" },
  async ({ event, step }) => {
    const { username, content } = event.data;

    // Задержка 3-5 минут для имитации живого человека
    const delayMinutes = Math.floor(Math.random() * 3) + 3;
    console.log(delayMinutes);
    //await step.sleep("human-delay", `${delayMinutes}m`);

    const result = await step.run("send-telegram-message", async () => {
      console.log("📤 Отправка сообщения по username", {
        username,
      });

      try {
        // Получаем любую активную сессию (можно улучшить логику выбора)
        const session = await db.query.telegramSession.findFirst({
          where: (sessions, { eq }) => eq(sessions.isActive, true),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });

        if (!session) {
          throw new Error("Нет активной Telegram сессии");
        }

        // Отправляем сообщение по username
        console.log(`📨 Отправка по username: @${username}`);
        const result = await tgClientSDK.sendMessageByUsername({
          apiId: Number.parseInt(session.apiId, 10),
          apiHash: session.apiHash,
          sessionData: session.sessionData as Record<string, string>,
          username,
          text: content,
        });

        // Обновляем lastUsedAt для сессии
        const { eq } = await import("@qbs-autonaim/db");
        await db
          .update(telegramSession)
          .set({ lastUsedAt: new Date() })
          .where(eq(telegramSession.id, session.id));

        console.log("✅ Сообщение отправлено по username", {
          username,
          telegramMessageId: result.messageId,
          sessionId: session.id,
        });

        return {
          success: true,
          telegramMessageId: result.messageId,
          chatId: result.chatId,
        };
      } catch (error) {
        console.error("❌ Ошибка отправки сообщения по username", {
          username,
          error,
        });
        throw error;
      }
    });

    return {
      success: true,
      username,
      telegramMessageId: result.telegramMessageId,
      chatId: result.chatId,
    };
  },
);
