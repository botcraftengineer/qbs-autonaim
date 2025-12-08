import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { handleAudioFile } from "./handlers/audio-file.js";
import { handleStartCommand } from "./handlers/start-command.js";
import { handleTextMessage } from "./handlers/text-message.js";
import { handleVoiceMessage } from "./handlers/voice-message.js";

/**
 * Создать обработчик обновлений для MTProto клиента
 */
export function createBotHandler(client: TelegramClient) {
  return async (message: Message) => {
    try {
      if (message.isOutgoing) {
        return;
      }

      if (message.text?.startsWith("/start")) {
        await handleStartCommand(client, message);
        return;
      }

      if (message.media?.type === "voice") {
        await handleVoiceMessage(client, message);
        return;
      }

      if (message.media?.type === "audio") {
        await handleAudioFile(client, message);
        return;
      }

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
