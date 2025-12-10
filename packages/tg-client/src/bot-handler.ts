import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { handleAudioFile } from "./handlers/audio-file";
import { handleStartCommand } from "./handlers/start-command";
import { handleTextMessage } from "./handlers/text-message";
import { handleTokenCommand } from "./handlers/token-command.js";
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
      console.log("Message received:", message);
      // Обработка команды /start с токеном
      if (message.text?.startsWith("/start")) {
        await handleStartCommand(client, message);
        return;
      }

      // Обработка команды /token для связывания беседы
      if (message.text?.startsWith("/token")) {
        await handleTokenCommand(client, message);
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
          await client.sendText(
            message.chat.id,
            "Я пока не могу вас идентифицировать 🤔\n\n" +
              "Чтобы я мог обработать ваше голосовое сообщение, сначала отправьте текстовое сообщение с названием вакансии, на которую вы откликались, или используйте команду /token с вашим токеном идентификации.\n\n" +
              "Также можете перейти по ссылке из моего сообщения в HH.ru — так я точно смогу вас идентифицировать.",
          );
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
