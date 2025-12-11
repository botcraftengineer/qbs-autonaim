import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { handleAudioFile } from "./handlers/audio-file";
import { handleTextMessage } from "./handlers/text-message";
import { handleUnidentifiedMessage } from "./handlers/unidentified-message";
import { handleVoiceMessage } from "./handlers/voice-message";
import { identifyCandidate } from "./utils/candidate-identifier";

/**
 * Создать обработчик обновлений для MTProto клиента
 */
export function createBotHandler(client: TelegramClient) {
  return async (message: Message) => {
    try {
      if (message.isOutgoing) {
        return;
      }

      // Попытка идентифицировать кандидата перед обработкой сообщения
      const identification = await identifyCandidate(message);

      if (!identification.identified) {
        // Кандидат не идентифицирован - пытаемся помочь найти его заявку
        if (message.text) {
          await handleUnidentifiedMessage(client, message);
        } else if (
          message.media?.type === "voice" ||
          message.media?.type === "audio"
        ) {
          // Пользователь отправил голосовое/аудио без идентификации
          const chatId = message.chat.id.toString();
          const errorMessage =
            "Привет! Не могу понять, кто ты 🤔\n\n" +
            "Напиши, пожалуйста, на какую вакансию откликался и свой 4-значный пин-код из сообщения. Тогда смогу послушать твое голосовое.";

          // Создаем временную беседу
          const { db } = await import("@qbs-autonaim/db/client");
          const { telegramConversation, telegramMessage } = await import(
            "@qbs-autonaim/db/schema"
          );
          const { triggerMessageSend } = await import("./utils/inngest.js");

          const [tempConversation] = await db
            .insert(telegramConversation)
            .values({
              chatId,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "none",
                awaitingPin: true,
              }),
            })
            .onConflictDoNothing()
            .returning();

          if (tempConversation) {
            const [botMessage] = await db
              .insert(telegramMessage)
              .values({
                conversationId: tempConversation.id,
                sender: "BOT",
                contentType: "TEXT",
                content: errorMessage,
              })
              .returning();

            if (botMessage) {
              await triggerMessageSend(botMessage.id, chatId, errorMessage);
            }
          }
        }
        return;
      }

      // Обработка голосовых сообщений
      if (message.media?.type === "voice") {
        await handleVoiceMessage(client, message);
        return;
      }

      // Обработка аудиофайлов
      if (message.media?.type === "audio") {
        await handleAudioFile(client, message);
        return;
      }

      // Обработка текстовых сообщений
      if (message.text) {
        await handleTextMessage(client, message);
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
    }
  };
}

/**
 * Отправить сообщение в чат
 */
export async function sendMessage(
  client: TelegramClient,
  chatId: string | number,
  text: string,
): Promise<Message> {
  return await client.sendText(chatId, text);
}
