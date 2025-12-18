import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { saveUnidentifiedMessage } from "./save-message";

export async function handleUnidentifiedMedia(params: {
  chatId: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const { chatId, messageId, username, firstName, workspaceId, botSettings } =
    params;

  // Для неидентифицированных пользователей не создаем conversation,
  // так как нет responseId. Просто логируем и возвращаем результат.
  console.log("Получено медиа от неидентифицированного пользователя:", {
    chatId,
    messageId,
    username,
    firstName,
  });

  // TODO: Реализовать логику обработки медиа от неидентифицированных пользователей
  // Возможно, нужно отправить сообщение с просьбой идентифицироваться

  return { processed: true, identified: false };
}
