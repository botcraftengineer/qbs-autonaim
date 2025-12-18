import type { BotSettings } from "../../types";

export async function handleUnidentifiedMedia(params: {
  chatId: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const { chatId, messageId, username, firstName } = params;

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
