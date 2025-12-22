import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramSession } from "@qbs-autonaim/db/schema";
import type { BotManager } from "../bot-manager";

/**
 * Сервис для отслеживания новых сессий в БД
 */
export class SessionWatcher {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private knownSessions = new Set<string>();
  private isRunning = false;
  private consecutiveErrors = 0;
  private readonly maxConsecutiveErrors = 5;

  constructor(
    private botManager: BotManager,
    private checkIntervalMs = 60000, // 60 секунд
  ) {}

  /**
   * Запустить отслеживание новых сессий
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("⚠️ SessionWatcher уже запущен");
      return;
    }

    console.log("👀 Запуск отслеживания новых Telegram сессий...");

    // Загружаем текущие активные сессии
    await this.loadKnownSessions();

    this.isRunning = true;

    // Периодически проверяем новые сессии
    this.intervalId = setInterval(() => {
      this.checkNewSessions().catch((error) => {
        console.error("❌ Ошибка проверки новых сессий:", error);
      });
    }, this.checkIntervalMs);

    console.log(
      `✅ SessionWatcher запущен (интервал: ${this.checkIntervalMs}ms)`,
    );
  }

  /**
   * Остановить отслеживание
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log("🛑 SessionWatcher остановлен");
  }

  /**
   * Загрузить известные сессии из БД
   */
  private async loadKnownSessions(): Promise<void> {
    const sessions = await db
      .select({ id: telegramSession.id })
      .from(telegramSession)
      .where(eq(telegramSession.isActive, true));

    this.knownSessions = new Set(sessions.map((s) => s.id));
    console.log(`📋 Загружено ${this.knownSessions.size} известных сессий`);
  }

  /**
   * Проверить наличие новых сессий
   */
  private async checkNewSessions(): Promise<void> {
    try {
      const sessions = await db
        .select()
        .from(telegramSession)
        .where(eq(telegramSession.isActive, true));

      // Успешный запрос — сбрасываем счётчик ошибок
      this.consecutiveErrors = 0;

      const newSessions = sessions.filter((s) => !this.knownSessions.has(s.id));

      if (newSessions.length === 0) {
        return;
      }

      console.log(`🆕 Обнаружено ${newSessions.length} новых сессий`);

      for (const session of newSessions) {
        try {
          // Проверяем, не запущена ли уже сессия для этого workspace
          if (this.botManager.isRunningForWorkspace(session.workspaceId)) {
            console.log(
              `⚠️ Сессия для workspace ${session.workspaceId} уже запущена`,
            );
            this.knownSessions.add(session.id);
            continue;
          }

          console.log(
            `🚀 Запуск новой сессии для workspace ${session.workspaceId}...`,
          );
          await this.botManager.restartBot(session.workspaceId);

          this.knownSessions.add(session.id);
          console.log(
            `✅ Сессия для workspace ${session.workspaceId} успешно запущена`,
          );
        } catch (error) {
          console.error(
            `❌ Ошибка запуска сессии ${session.id}:`,
            error instanceof Error ? error.message : error,
          );
        }
      }
    } catch (error) {
      this.consecutiveErrors++;
      console.error(
        `❌ Ошибка запроса к БД (попытка ${this.consecutiveErrors}/${this.maxConsecutiveErrors}):`,
        error instanceof Error ? error.message : error,
      );

      if (this.consecutiveErrors >= this.maxConsecutiveErrors) {
        console.error(
          `🛑 Достигнут лимит ошибок (${this.maxConsecutiveErrors}), остановка SessionWatcher`,
        );
        this.stop();
      }
    }
  }

  /**
   * Получить статус watcher'а
   */
  getStatus(): {
    isRunning: boolean;
    knownSessionsCount: number;
    checkIntervalMs: number;
  } {
    return {
      isRunning: this.isRunning,
      knownSessionsCount: this.knownSessions.size,
      checkIntervalMs: this.checkIntervalMs,
    };
  }
}
