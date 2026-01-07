import { env } from "@qbs-autonaim/config";
import { botManager } from "../bot-manager";
import { SessionWatcher } from "../services/session-watcher";
import app from "./server";

const port = env.TG_CLIENT_PORT ?? 8001;
let isShuttingDown = false;

// Создаем watcher для автоматического запуска новых сессий
const sessionWatcher = new SessionWatcher(botManager);

console.log(`🚀 Запуск Telegram Client API на порту ${port}`);

// Graceful shutdown handler
async function shutdown(signal: string) {
  if (isShuttingDown) {
    console.log("⚠️ Shutdown уже в процессе...");
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 Получен сигнал ${signal}, останавливаем сервисы...`);

  try {
    sessionWatcher.stop();
    await botManager.stopAll();
    console.log("✅ Все сервисы остановлены");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при остановке:", error);
    process.exit(1);
  }
}

// Запускаем ботов при старте API (они нужны для обработки запросов)
botManager
  .startAll()
  .then(async () => {
    const count = botManager.getBotsCount();
    console.log(`✅ Telegram боты запущены: ${count} шт.`);

    const botsInfo = botManager.getBotsInfo();
    for (const bot of botsInfo) {
      console.log(
        `  📱 Workspace: ${bot.workspaceId}, User: @${bot.username || bot.userId}`,
      );
    }

    // Запускаем watcher для автоматического подхвата новых сессий
    await sessionWatcher.start();

    // Обработка graceful shutdown
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

    // Обработка необработанных ошибок
    process.on("unhandledRejection", (reason, promise) => {
      console.error(
        "❌ Необработанное отклонение промиса:",
        promise,
        "причина:",
        reason,
      );
    });

    process.on("uncaughtException", (error) => {
      console.error("❌ Необработанное исключение:", error);
      shutdown("UNCAUGHT_EXCEPTION");
    });
  })
  .catch((error) => {
    console.error("❌ Ошибка запуска ботов:", error);
    process.exit(1);
  });

export default {
  fetch: app.fetch,
  port,
};

console.log(`✅ Telegram Client API запущен на http://localhost:${port}`);
