import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramConversation, telegramMessage } from "@qbs-autonaim/db/schema";
import { handleAudioFile } from "./handlers/audio-file";
import { handleTextMessage } from "./handlers/text-message";
import { handleUnidentifiedMessage } from "./handlers/unidentified-message";
import { handleVoiceMessage } from "./handlers/voice-message";
import { identifyCandidate } from "./utils/candidate-identifier";
import { triggerMessageSend } from "./utils/inngest";

/**
 * Создать обработчик обновлений для MTProto клиента
 */
export function createBotHandler(client: TelegramClient, workspaceId: string) {
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
          await handleUnidentifiedMessage(client, message, workspaceId);
          return;
        } else if (
          message.media?.type === "voice" ||
          message.media?.type === "audio"
        ) {
          // Пользователь отправил голосовое/аудио без идентификации
          const chatId = message.chat.id.toString();
          const errorMessage =
            "Привет! Не могу понять, кто ты 🤔\n\n" +
            "Напиши, пожалуйста, на какую вакансию откликался и свой 4-значный пин-код из сообщения. Тогда смогу послушать твое голосовое.";

          const sender = message.sender;
          let username: string | undefined;
          let firstName: string | undefined;
          if (sender && "username" in sender && sender.username) {
            username = sender.username;
          }
          if (sender?.type === "user") {
            firstName = sender.firstName || undefined;
          }

          // Создаем или получаем временную беседу
          let [tempConversation] = await db
            .select()
            .from(telegramConversation)
            .where(eq(telegramConversation.chatId, chatId))
            .limit(1);

          if (!tempConversation) {
            [tempConversation] = await db
              .insert(telegramConversation)
              .values({
                chatId,
                candidateName: firstName || undefined,
                username,
                status: "ACTIVE",
                metadata: JSON.stringify({
                  identifiedBy: "none",
                  awaitingPin: true,
                }),
              })
              .returning();
          }

          if (tempConversation) {
            // Сохраняем голосовое/аудио сообщение пользователя
            await db.insert(telegramMessage).values({
              conversationId: tempConversation.id,
              sender: "CANDIDATE",
              contentType: "VOICE",
              content: "Голосовое сообщение (кандидат не идентифицирован)",
              telegramMessageId: message.id.toString(),
            });

            // Сохраняем ответ бота
            const [botMessage] = await db
              .insert(telegramMessage)
              .values({
                conversationId: tempConversation.id,
                sender: "BOT",
                contentType: "TEXT",
                content: errorMessage,
              })
              .returning();

            if (botMessage && username) {
              await triggerMessageSend(
                botMessage.id,
                username,
                errorMessage,
                workspaceId,
              );
            }
          }
        }
        return;
      }

      // Обработка голосовых сообщений
      if (message.media?.type === "voice") {
        await handleVoiceMessage(client, message, workspaceId);
        return;
      }

      // Обработка аудиофайлов
      if (message.media?.type === "audio") {
        await handleAudioFile(client, message, workspaceId);
        return;
      }

      // Обработка текстовых сообщений
      if (message.text) {
        await handleTextMessage(client, message, workspaceId);
      }
    } catch (error) {
      console.error("Ошибка обработки сообщения:", error);
      throw error;
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
