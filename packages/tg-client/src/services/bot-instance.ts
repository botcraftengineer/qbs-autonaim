/**
 * Управление отдельным экземпляром бота
 */

import { TelegramClient } from "@mtcute/bun";
import { Dispatcher } from "@mtcute/dispatcher";
import type { telegramSession } from "@qbs-autonaim/db/schema";
import { ExportableStorage } from "../storage";
import { isAuthError } from "../utils/auth-errors";
import { triggerIncomingMessage } from "../utils/inngest";

export interface BotInstance {
  client: TelegramClient;
  workspaceId: string;
  sessionId: string;
  userId: string;
  username?: string;
  phone: string;
}

export interface BotInstanceConfig {
  session: typeof telegramSession.$inferSelect;
  onAuthError: (
    sessionId: string,
    workspaceId: string,
    phone: string,
    errorType: string,
    errorMessage: string,
  ) => Promise<void>;
}

/**
 * Создает и запускает экземпляр бота
 */
export async function createBotInstance(
  config: BotInstanceConfig,
): Promise<BotInstance> {
  const { session, onAuthError } = config;
  const {
    id: sessionId,
    workspaceId,
    apiId,
    apiHash,
    sessionData,
    phone,
  } = session;
  if (!apiId || !apiHash) {
    throw new Error(
      `Отсутствуют apiId или apiHash для workspace ${workspaceId}`,
    );
  }

  // Парсим и валидируем apiId
  const parsedApiId = Number.parseInt(apiId, 10);
  if (Number.isNaN(parsedApiId)) {
    throw new Error(
      `Некорректное значение apiId для workspace ${workspaceId}: "${apiId}" не является числом`,
    );
  }

  // Создаем storage и импортируем сессию
  const storage = new ExportableStorage();
  if (sessionData) {
    await storage.import(sessionData as Record<string, string>);
  }

  // Создаем клиент
  const client = new TelegramClient({
    apiId: parsedApiId,
    apiHash,
    storage,
    updates: {
      catchUp: true,
      messageGroupingInterval: 250,
    },
    logLevel: 1,
  });

  console.log(`🔌 Подключение клиента для workspace ${workspaceId}...`);

  // Проверяем авторизацию
  let user: Awaited<ReturnType<typeof client.getMe>> | null = null;
  try {
    user = await client.getMe();
  } catch (error) {
    const authCheck = isAuthError(error);
    if (authCheck.isAuth) {
      await onAuthError(
        sessionId,
        workspaceId,
        phone,
        authCheck.errorType || "AUTH_ERROR",
        authCheck.errorMessage || "Неизвестная ошибка аутентификации",
      );
      throw new Error(
        `Сессия не авторизована для workspace ${workspaceId}: ${authCheck.errorType}`,
      );
    }
    throw error;
  }

  if (!user) {
    throw new Error(
      `Не удалось получить информацию о пользователе для workspace ${workspaceId}`,
    );
  }

  // Создаем dispatcher
  const dp = Dispatcher.for(client);

  // Регистрируем обработчик сообщений - триггерим Inngest
  dp.onNewMessage(async (msg) => {
    console.log("new message", msg.id);
    try {
      // Сериализуем данные сообщения для Inngest
      const messageData = {
        id: msg.id,
        chatId: msg.chat.id.toString(),
        text: msg.text,
        isOutgoing: msg.isOutgoing,
        media: msg.media
          ? {
              type: msg.media.type,
            }
          : undefined,
        sender: msg.sender
          ? {
              type: msg.sender.type,
              username:
                "username" in msg.sender ? msg.sender.username : undefined,
              firstName:
                msg.sender.type === "user" ? msg.sender.firstName : undefined,
            }
          : undefined,
      };

      await triggerIncomingMessage(workspaceId, messageData);
    } catch (error) {
      const authCheck = isAuthError(error);
      if (authCheck.isAuth) {
        await onAuthError(
          sessionId,
          workspaceId,
          phone,
          authCheck.errorType || "AUTH_ERROR",
          authCheck.errorMessage || "Неизвестная ошибка аутентификации",
        );
        return;
      }
      console.error(
        `❌ [${workspaceId}] Ошибка триггера сообщения ${msg.id}:`,
        error,
      );
    }
  });

  // Обработчик ошибок dispatcher
  dp.onError(async (err, upd) => {
    const authCheck = isAuthError(err);
    if (authCheck.isAuth) {
      await onAuthError(
        sessionId,
        workspaceId,
        phone,
        authCheck.errorType || "AUTH_ERROR",
        authCheck.errorMessage || "Неизвестная ошибка аутентификации",
      );
      return true;
    }

    console.error(`❌ [${workspaceId}] Ошибка в dispatcher:`, err);
    console.error(`Обновление:`, upd.name);
    return false;
  });

  console.log(`✅ Dispatcher зарегистрирован для workspace ${workspaceId}`);

  // Подключаемся
  await client.start();

  console.log(
    `✅ Бот запущен для workspace ${workspaceId}: ${user.firstName || ""} ${user.lastName || ""} (@${user.username || "no username"}) [${phone}]`,
  );

  return {
    client,
    workspaceId,
    sessionId,
    userId: user.id.toString(),
    username: user.username || undefined,
    phone,
  };
}
