import { execSync } from "node:child_process";

/**
 * Полная миграция схемы базы данных
 * 1. Применяет изменения схемы (создаёт новые таблицы)
 * 2. Мигрирует данные из старых таблиц
 */
async function migrateAll() {
  console.log("🚀 Начинаю полную миграцию базы данных...\n");

  try {
    // Шаг 1: Применить изменения схемы
    console.log("📝 Шаг 1: Применение изменений схемы...");
    console.log("Выполняю: bun run push\n");

    execSync("bun run push", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("\n✅ Схема обновлена успешно!\n");

    // Шаг 2: Миграция conversations
    console.log("📦 Шаг 2: Миграция данных conversations...");
    console.log("Выполняю: bun run migrate-conversations\n");

    execSync("bun run migrate-conversations", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("\n✅ Conversations мигрированы!\n");

    // Шаг 3: Миграция messages
    console.log("📦 Шаг 3: Миграция данных messages...");
    console.log("Выполняю: bun run migrate-messages\n");

    execSync("bun run migrate-messages", {
      stdio: "inherit",
      cwd: process.cwd(),
    });

    console.log("\n✅ Messages мигрированы!\n");

    console.log("🎉 Полная миграция завершена успешно!");
    console.log("\n📋 Следующие шаги:");
    console.log("1. Проверьте данные в новых таблицах");
    console.log("2. Убедитесь, что приложение работает корректно");
    console.log("3. Удалите backup таблицы:");
    console.log("   DROP TABLE telegram_conversations_backup;");
    console.log("   DROP TABLE telegram_messages_backup;");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Ошибка при миграции:", error);
    console.log("\n🔄 Для отката изменений:");
    console.log("1. Удалите новые таблицы (если созданы)");
    console.log("2. Переименуйте backup таблицы обратно");
    process.exit(1);
  }
}

migrateAll();
