/**
 * Менеджер для управления несколькими ботами Telegram
 */

import type { TelegramClient } from "@mtcute/bun";
import type { telegramSession } from "@qbs-autonaim/db/schema";
import type { BotInstance } from "./services/bot-instance";
import { createBotInstance } from "./services/bot-instance";
import { processMissedMessages } from "./services/missed-messages-processor";
import { sendAuthErrorEvent } from "./utils/event-notifier";
import {
  getActiveSessions,
  getSessionByWorkspace,
  markSessionAsInvalid,
  saveSessionData,
} from "./utils/session-manager";

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

    const sessions = await getActiveSessions();

    if (sessions.length === 0) {
      console.log("⚠️ Нет активных Telegram сессий");
      return;
    }

    console.log(`📋 Найдено ${sessions.length} сессий`);

    const startPromises = sessions.map((session) => this.startBot(session));
    const results = await Promise.allSettled(startPromises);

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`✅ Успешно запущено: ${successful}`);
    if (failed > 0) {
      console.log(`❌ Ошибок: ${failed}`);
    }

    this.isRunning = true;

    if (successful > 0) {
      console.log("🔍 Запуск обработки пропущенных сообщений...");
      this.processMissedMessages().catch((error) => {
        console.error("❌ Ошибка обработки пропущенных сообщений:", error);
      });
    }
  }

  /**
   * Обработка ошибки авторизации
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

    this.bots.delete(workspaceId);
    await markSessionAsInvalid(sessionId, errorType, errorMessage);
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
    const { workspaceId } = session;

    try {
      const botInstance = await createBotInstance({
        session,
        onAuthError: this.handleAuthError.bind(this),
      });

      this.bots.set(workspaceId, botInstance);
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

    for (const [workspaceId, bot] of this.bots.entries()) {
      // Останавливаем автосохранение кэша
      if (bot.cacheSaveInterval) {
        clearInterval(bot.cacheSaveInterval);
      }

      // Сохраняем кэш перед остановкой
      try {
        const exportedData = await bot.storage.export();
        await saveSessionData(bot.sessionId, exportedData);
        await bot.client.disconnect();
        console.log(`💾 Кэш сохранен для workspace ${workspaceId}`);
      } catch (error) {
        console.error(
          `❌ Ошибка сохранения кэша для workspace ${workspaceId}:`,
          error,
        );
      }

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

    const existing = this.bots.get(workspaceId);
    if (existing) {
      // Останавливаем автосохранение кэша
      if (existing.cacheSaveInterval) {
        clearInterval(existing.cacheSaveInterval);
      }

      // Сохраняем кэш перед закрытием
      try {
        console.log(`💾 Сохранение кэша для workspace ${workspaceId}...`);
        const exportedData = await existing.storage.export();
        await saveSessionData(existing.sessionId, exportedData);
      } catch (error) {
        console.error(
          `⚠️ Ошибка сохранения кэша для workspace ${workspaceId}:`,
          error,
        );
      }

      // Корректно закрываем соединение перед удалением
      try {
        console.log(`🔌 Закрытие соединения для workspace ${workspaceId}...`);
        await existing.client.disconnect();
        console.log(`✅ Соединение закрыто для workspace ${workspaceId}`);
      } catch (error) {
        console.error(
          `⚠️ Ошибка при закрытии соединения для workspace ${workspaceId}:`,
          error,
        );
        // Продолжаем перезапуск даже при ошибке закрытия
      }
      this.bots.delete(workspaceId);
    }

    const session = await getSessionByWorkspace(workspaceId);

    if (!session) {
      throw new Error(
        `Telegram сессия не найдена для workspace ${workspaceId}`,
      );
    }

    await this.startBot(session);

    // Обрабатываем пропущенные сообщения после перезапуска
    console.log(
      `🔍 Запуск обработки пропущенных сообщений для workspace ${workspaceId}...`,
    );
    this.processMissedMessages().catch((error) => {
      console.error(
        `❌ Ошибка обработки пропущенных сообщений для workspace ${workspaceId}:`,
        error,
      );
    });
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
   */
  async processMissedMessages(): Promise<void> {
    await processMissedMessages({
      getClient: this.getClient.bind(this),
    });
  }
}

// Singleton instance
export const botManager = new BotManager();
