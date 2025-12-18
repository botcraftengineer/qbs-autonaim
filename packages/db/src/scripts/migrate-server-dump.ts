import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";

/**
 * Скрипт переноса данных через pg_dump/pg_restore
 * Более быстрый и надёжный способ для больших объёмов данных
 *
 * Использование:
 * SOURCE_DB_URL="postgres://..." TARGET_DB_URL="postgres://..." bun run migrate-server-dump
 */

const SOURCE_DB_URL = process.env.SOURCE_DB_URL;
const TARGET_DB_URL = process.env.TARGET_DB_URL || process.env.POSTGRES_URL;
const DUMP_FILE = "database_dump.sql";

if (!SOURCE_DB_URL) {
  console.error("❌ Не указан SOURCE_DB_URL");
  console.log("Использование:");
  console.log(
    'SOURCE_DB_URL="postgres://..." TARGET_DB_URL="postgres://..." bun run migrate-server-dump',
  );
  process.exit(1);
}

if (!TARGET_DB_URL) {
  console.error("❌ Не указан TARGET_DB_URL или POSTGRES_URL");
  process.exit(1);
}

async function migrateServerDump() {
  console.log("🚀 Начинаю перенос данных через pg_dump...\n");

  try {
    // Шаг 1: Создаём дамп базы данных
    console.log("📦 Шаг 1: Создание дампа базы данных...");
    console.log(`   Источник: ${maskUrl(SOURCE_DB_URL!)}`);

    execSync(
      `pg_dump "${SOURCE_DB_URL}" --data-only --no-owner --no-privileges > ${DUMP_FILE}`,
      {
        stdio: "inherit",
      },
    );

    console.log(`✅ Дамп создан: ${DUMP_FILE}\n`);

    // Шаг 2: Восстанавливаем дамп на целевом сервере
    console.log("📥 Шаг 2: Восстановление данных на целевом сервере...");
    console.log(`   Цель: ${maskUrl(TARGET_DB_URL!)}`);

    execSync(`psql "${TARGET_DB_URL}" < ${DUMP_FILE}`, {
      stdio: "inherit",
    });

    console.log("\n✅ Данные восстановлены успешно!");

    // Шаг 3: Удаляем временный файл
    if (existsSync(DUMP_FILE)) {
      unlinkSync(DUMP_FILE);
      console.log(`🗑️  Временный файл ${DUMP_FILE} удалён`);
    }

    console.log("\n🎉 Перенос данных завершён успешно!");
  } catch (error) {
    console.error("\n❌ Ошибка при переносе:", error);

    // Очистка при ошибке
    if (existsSync(DUMP_FILE)) {
      unlinkSync(DUMP_FILE);
    }

    process.exit(1);
  }
}

function maskUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.username}:***@${parsed.host}${parsed.pathname}`;
  } catch {
    return "***";
  }
}

migrateServerDump();
