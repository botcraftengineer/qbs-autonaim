import { TelegramClient } from "@mtcute/bun";
import { Dispatcher } from "@mtcute/dispatcher";
import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession } from "@qbs-autonaim/db/schema";
import { createBotHandler } from "./bot-handler";
import { ExportableStorage } from "./storage";

interface BotInstance {
  client: TelegramClient;
  workspaceId: string;
  sessionId: string;
  userId: string;
  username?: string;
  phone: string;
}

/**
 * Known Telegram auth error types that indicate session is invalid
 */
const AUTH_ERROR_TYPES = [
  "AUTH_KEY_UNREGISTERED",
  "AUTH_KEY_INVALID",
  "AUTH_KEY_PERM_EMPTY",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
  "USER_DEACTIVATED",
  "USER_DEACTIVATED_BAN",
] as const;

type AuthErrorType = (typeof AUTH_ERROR_TYPES)[number];

/**
 * Check if an error is a Telegram auth error
 */
function isAuthError(error: unknown): {
  isAuth: boolean;
  errorType?: AuthErrorType;
  errorMessage?: string;
} {
  if (!error || typeof error !== "object") {
    return { isAuth: false };
  }

  let errorText = "";

  // Check for text property (MTCute error format)
  if ("text" in error) {
    errorText = String(error.text);
  }
  // Check for message property (standard Error)
  else if ("message" in error) {
    errorText = String(error.message);
  }
  // Check for name property
  else if ("name" in error) {
    errorText = String(error.name);
  }

  for (const authError of AUTH_ERROR_TYPES) {
    if (errorText.includes(authError)) {
      return {
        isAuth: true,
        errorType: authError,
        errorMessage: errorText,
      };
    }
  }

  return { isAuth: false };
}

/**
 * Send Inngest event to notify workspace admins about auth error
 */
async function sendAuthErrorEvent(
  sessionId: string,
  workspaceId: string,
  errorType: string,
  errorMessage: string,
  phone: string,
): Promise<void> {
  try {
    const eventKey = env.INNGEST_EVENT_KEY;
    const baseUrl = env.INNGEST_EVENT_API_BASE_URL;

    if (!eventKey) {
      console.warn(
        "⚠️ INNGEST_EVENT_KEY не установлен, невозможно отправить событие об ошибке авторизации",
      );
      return;
    }

    const response = await fetch(`${baseUrl}/e/${eventKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "telegram/auth.error",
        data: {
          sessionId,
          workspaceId,
          errorType,
          errorMessage,
          phone,
        },
      }),
    });

    if (!response.ok) {
      console.error(
        `❌ Не удалось отправить событие об ошибке авторизации: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log(
        `📧 Событие об ошибке авторизации отправлено для workspace ${workspaceId}`,
      );
    }
  } catch (error) {
    console.error("❌ Ошибка отправки события об ошибке авторизации:", error);
  }
}

/**
 * Mark session as invalid in the database
 */
async function markSessionAsInvalid(
  sessionId: string,
  errorType: string,
  _errorMessage: string,
): Promise<void> {
  await db
    .update(telegramSession)
    .set({
      isActive: false,
      authError: errorType,
      authErrorAt: new Date(),
    })
    .where(eq(telegramSession.id, sessionId));

  console.log(
    `📛 Сессия ${sessionId} помечена как недействительная: ${errorType}`,
  );
}

/**
 * Менеджер для управления несколькими ботами
 */
class BotManager {
  private bots: Map<string, BotInstance> = new Map();
  private isRunning = false;

  /**
   * Запустить всех ботов из БД
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ Боты уже запущены");
      return;
    }

    console.log("🚀 Запуск всех Telegram ботов...");

    // Получаем все активные Telegram сессии
    const sessions = await db
      .select()
      .from(telegramSession)
      .where(eq(telegramSession.isActive, true));

    if (sessions.length === 0) {
      console.log("⚠️ Нет активных Telegram сессий");
      return;
    }

    console.log(`📋 Найдено ${sessions.length} сессий`);

    // Запускаем бота для каждой сессии
    const startPromises = sessions.map((session) => this.startBot(session));

    const results = await Promise.allSettled(startPromises);

    // Подсчитываем результаты
    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Успешно запущено: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Ошибок: ${failed}`);
    }

    this.isRunning = true;

    // Обрабатываем пропущенные сообщения после запуска всех ботов
    if (successful > 0) {
      console.log("⏳ Запуск обработки пропущенных сообщений...");
      // Запускаем асинхронно, чтобы не блокировать старт
      this.processMissedMessages().catch((error) => {
        console.error("❌ Ошибка обработки пропущенных сообщений:", error);
      });
    }
  }

  /**
   * Handle auth error - mark session as invalid and notify admins
   */
  private async handleAuthError(
    sessionId: string,
    workspaceId: string,
    phone: string,
    errorType: string,
    errorMessage: string,
  ): Promise<void> {
    console.log(
      `🔐 Auth error detected for workspace ${workspaceId}: ${errorType}`,
    );

    // Remove bot from active bots
    this.bots.delete(workspaceId);

    // Mark session as invalid in DB
    await markSessionAsInvalid(sessionId, errorType, errorMessage);

    // Send notification event
    await sendAuthErrorEvent(
      sessionId,
      workspaceId,
      errorType,
      errorMessage,
      phone,
    );
  }

  /**
   * Запустить одного бота
   */
  private async startBot(
    session: typeof telegramSession.$inferSelect,
  ): Promise<void> {
    const {
      id: sessionId,
      workspaceId,
      apiId,
      apiHash,
      sessionData,
      phone,
    } = session;

    try {
      if (!apiId || !apiHash) {
        throw new Error(
          `Отсутствуют apiId или apiHash для workspace ${workspaceId}`,
        );
      }

      // Создаем storage и импортируем сессию
      const storage = new ExportableStorage();
      if (sessionData) {
        await storage.import(sessionData as Record<string, string>);
      }

      // Создаем клиент с настройками для получения обновлений
      const client = new TelegramClient({
        apiId: Number.parseInt(apiId, 10),
        apiHash,
        storage,
        updates: {
          catchUp: true, // Получать пропущенные обновления
          messageGroupingInterval: 250, // Группировать альбомы (250ms)
        },
        logLevel: 1,
      });

      console.log(`🔌 Подключение клиента для workspace ${workspaceId}...`);

      // Проверяем авторизацию
      let user: Awaited<ReturnType<typeof client.getMe>> | null = null;
      try {
        user = await client.getMe();
      } catch (error) {
        // Проверяем, является ли это ошибкой авторизации
        const authCheck = isAuthError(error);
        if (authCheck.isAuth) {
          await this.handleAuthError(
            sessionId,
            workspaceId,
            phone,
            authCheck.errorType || "AUTH_ERROR",
            authCheck.errorMessage || "Неизвестная ошибка аутентификации",
          );
          throw new Error(
            `Сессия не авторизована для workspace ${workspaceId}: ${authCheck.errorType}. Требуется повторная авторизация.`,
          );
        }
        // Другая ошибка - пробрасываем дальше
        throw error;
      }

      if (!user) {
        throw new Error(
          `Не удалось получить информацию о пользователе для workspace ${workspaceId}`,
        );
      }

      // Создаем dispatcher
      const dp = Dispatcher.for(client);

      // Создаем обработчик один раз
      const messageHandler = createBotHandler(client);

      // Регистрируем обработчик через dispatcher
      dp.onNewMessage(async (msg) => {
        try {
          await messageHandler(msg);
        } catch (error) {
          // Check if this is an auth error during message handling
          const authCheck = isAuthError(error);
          if (authCheck.isAuth) {
            await this.handleAuthError(
              sessionId,
              workspaceId,
              phone,
              authCheck.errorType || "AUTH_ERROR",
              authCheck.errorMessage || "Неизвестная ошибка аутентификации",
            );
            return;
          }
          console.error(`❌ [${workspaceId}] Ошибка обработки:`, error);
        }
      });

      // Добавляем обработчик ошибок
      dp.onError(async (err, upd) => {
        // Check if this is an auth error
        const authCheck = isAuthError(err);
        if (authCheck.isAuth) {
          await this.handleAuthError(
            sessionId,
            workspaceId,
            phone,
            authCheck.errorType || "AUTH_ERROR",
            authCheck.errorMessage || "Неизвестная ошибка аутентификации",
          );
          return true; // Stop processing
        }

        console.error(`❌ [${workspaceId}] Ошибка в dispatcher:`, err);
        console.error(`Обновление:`, upd.name);
        return false; // Не останавливать обработку
      });

      console.log(`✅ Dispatcher зарегистрирован для workspace ${workspaceId}`);

      // Сохраняем экземпляр бота
      const botInstance: BotInstance = {
        client,
        workspaceId,
        sessionId,
        userId: user.id.toString(),
        username: user.username || undefined,
        phone,
      };

      this.bots.set(workspaceId, botInstance);

      // Подключаемся
      await client.start();

      console.log(
        `✅ Бот запущен для workspace ${workspaceId}: ${user.firstName || ""} ${user.lastName || ""} (@${user.username || "no username"}) [${phone}]`,
      );
    } catch (error) {
      console.error(
        `❌ Ошибка запуска бота для workspace ${workspaceId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Остановить всех ботов
   */
  async stopAll(): Promise<void> {
    console.log("🛑 Остановка всех ботов...");

    for (const [workspaceId] of this.bots.entries()) {
      // MTCute автоматически управляет соединением
      console.log(`✅ Бот остановлен для workspace ${workspaceId}`);
    }

    this.bots.clear();
    this.isRunning = false;
    console.log("✅ Все боты остановлены");
  }

  /**
   * Перезапустить бота для конкретного workspace
   */
  async restartBot(workspaceId: string): Promise<void> {
    console.log(`🔄 Перезапуск бота для workspace ${workspaceId}...`);

    // Останавливаем существующего бота
    const existing = this.bots.get(workspaceId);
    if (existing) {
      // MTCute автоматически управляет соединением
      this.bots.delete(workspaceId);
    }

    // Получаем сессию из БД
    const [session] = await db
      .select()
      .from(telegramSession)
      .where(eq(telegramSession.workspaceId, workspaceId))
      .limit(1);

    if (!session) {
      throw new Error(
        `Telegram сессия не найдена для workspace ${workspaceId}`,
      );
    }

    // Запускаем нового бота
    await this.startBot(session);
  }

  /**
   * Получить информацию о запущенных ботах
   */
  getBotsInfo(): Array<{
    workspaceId: string;
    sessionId: string;
    userId: string;
    username?: string;
    phone: string;
  }> {
    return Array.from(this.bots.values()).map((bot) => ({
      workspaceId: bot.workspaceId,
      sessionId: bot.sessionId,
      userId: bot.userId,
      username: bot.username,
      phone: bot.phone,
    }));
  }

  /**
   * Получить клиента для workspace
   */
  getClient(workspaceId: string): TelegramClient | null {
    return this.bots.get(workspaceId)?.client || null;
  }

  /**
   * Проверить, запущен ли бот для workspace
   */
  isRunningForWorkspace(workspaceId: string): boolean {
    return this.bots.has(workspaceId);
  }

  /**
   * Получить количество запущенных ботов
   */
  getBotsCount(): number {
    return this.bots.size;
  }

  /**
   * Обработать пропущенные сообщения для всех активных диалогов
   * Вызывается при запуске сервиса для обработки сообщений, полученных во время простоя
   */
  async processMissedMessages(): Promise<void> {
    console.log("🔍 Проверка пропущенных сообщений...");

    const { telegramConversation, telegramMessage } = await import(
      "@qbs-autonaim/db/schema"
    );

    // Получаем все активные беседы
    const conversations = await db
      .select()
      .from(telegramConversation)
      .where(eq(telegramConversation.status, "ACTIVE"));

    if (conversations.length === 0) {
      console.log("ℹ️ Нет активных бесед для проверки");
      return;
    }

    console.log(`📋 Найдено ${conversations.length} активных бесед`);

    let processedCount = 0;
    let errorCount = 0;

    for (const conversation of conversations) {
      try {
        // Получаем последнее сообщение из БД для этой беседы
        const { desc } = await import("@qbs-autonaim/db");
        const lastMessage = await db
          .select()
          .from(telegramMessage)
          .where(eq(telegramMessage.conversationId, conversation.id))
          .orderBy(desc(telegramMessage.createdAt))
          .limit(1);

        const lastMessageDate = lastMessage[0]?.createdAt;

        // Получаем workspace для этой беседы
        if (!conversation.responseId) {
          continue;
        }

        const { vacancyResponse } = await import("@qbs-autonaim/db/schema");
        const response = await db.query.vacancyResponse.findFirst({
          where: eq(vacancyResponse.id, conversation.responseId),
          with: {
            vacancy: true,
          },
        });

        if (!response?.vacancy?.workspaceId) {
          continue;
        }

        const client = this.getClient(response.vacancy.workspaceId);
        if (!client) {
          console.log(
            `⚠️ Клиент не найден для workspace ${response.vacancy.workspaceId}`,
          );
          continue;
        }

        // Получаем историю сообщений из Telegram
        const messages: Array<{
          id: number;
          text?: string;
          date: Date;
          isOutgoing: boolean;
        }> = [];

        // Преобразуем chatId в число для MTCute
        const chatIdNumber = Number.parseInt(conversation.chatId, 10);
        if (Number.isNaN(chatIdNumber)) {
          console.log(
            `⚠️ Некорректный chatId для беседы ${conversation.id}: ${conversation.chatId}`,
          );
          continue;
        }

        try {
          for await (const msg of client.iterHistory(chatIdNumber, {
            limit: 20,
          })) {
            messages.push({
              id: msg.id,
              text: msg.text,
              date: msg.date,
              isOutgoing: msg.isOutgoing,
            });
          }
        } catch (historyError) {
          // Пропускаем чаты, которые не найдены в кэше или недоступны
          const errorMessage =
            historyError instanceof Error
              ? historyError.message
              : String(historyError);

          if (
            errorMessage.includes("not found in local cache") ||
            errorMessage.includes("PEER_ID_INVALID") ||
            errorMessage.includes("CHANNEL_INVALID")
          ) {
            console.log(
              `⚠️ Чат ${conversation.chatId} не найден в кэше, пропускаем`,
            );
            continue;
          }
          // Другие ошибки пробрасываем дальше
          throw historyError;
        }

        // Фильтруем только входящие сообщения, которые новее последнего в БД
        const missedMessages = messages.filter((msg) => {
          if (msg.isOutgoing) return false;
          if (!lastMessageDate) return true;
          return msg.date > lastMessageDate;
        });

        if (missedMessages.length > 0) {
          console.log(
            `📨 Найдено ${missedMessages.length} пропущенных сообщений в чате ${conversation.chatId}`,
          );

          // Обрабатываем пропущенные сообщения в хронологическом порядке
          for (const msg of missedMessages.reverse()) {
            try {
              // Получаем полное сообщение из Telegram
              const fullMessage = await client.getMessages(chatIdNumber, [
                msg.id,
              ]);

              if (fullMessage[0]) {
                const messageHandler = createBotHandler(client);
                await messageHandler(fullMessage[0]);
                processedCount++;
              }
            } catch (msgError) {
              console.error(
                `❌ Ошибка обработки сообщения ${msg.id}:`,
                msgError,
              );
              errorCount++;
            }
          }
        }
      } catch (error) {
        console.error(
          `❌ Ошибка проверки беседы ${conversation.chatId}:`,
          error,
        );
        errorCount++;
      }
    }

    console.log(
      `✅ Обработка пропущенных сообщений завершена: обработано ${processedCount}, ошибок ${errorCount}`,
    );
  }
}

// Singleton instance
export const botManager = new BotManager();
