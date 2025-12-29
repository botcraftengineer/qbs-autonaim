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

  // Отправляем сообщение с просьбой идентифицироваться
  // Медиа от неидентифицированных пользователей игнорируется
  // Пользователь должен сначала отправить PIN-код для идентификации

  return {
    processed: true,
    identified: false,
    message:
      "Медиа от неидентифицированного пользователя проигнорировано. Требуется PIN-код для идентификации.",
  };
}
