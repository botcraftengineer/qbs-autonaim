import { botManager } from "../bot-manager";
import app from "./server";

const port = Number.parseInt(process.env.TG_CLIENT_PORT || "8001", 10);

console.log(`🚀 Запуск Telegram Client API на порту ${port}`);

// Запускаем ботов при старте API
botManager
  .startAll()
  .then(() => {
    const count = botManager.getBotsCount();
    console.log(`✅ Telegram боты запущены: ${count} шт.`);

    const botsInfo = botManager.getBotsInfo();
    for (const bot of botsInfo) {
      console.log(
        `  📱 Workspace: ${bot.workspaceId}, User: @${bot.username || bot.userId}`,
      );
    }
  })
  .catch((error) => {
    console.error("❌ Ошибка запуска ботов:", error);
  });

export default {
  fetch: app.fetch,
  port,
};

console.log(`✅ Telegram Client API запущен на http://localhost:${port}`);
