import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * Скрипт переноса данных со старого сервера на новый
 *
 * Использование:
 * SOURCE_DB_URL="postgres://..." TARGET_DB_URL="postgres://..." bun run migrate-server
 */

const SOURCE_DB_URL = process.env.SOURCE_DB_URL;
const TARGET_DB_URL = process.env.TARGET_DB_URL || process.env.POSTGRES_URL;

if (!SOURCE_DB_URL) {
  console.error("❌ Не указан SOURCE_DB_URL");
  console.log("Использование:");
  console.log(
    'SOURCE_DB_URL="postgres://..." TARGET_DB_URL="postgres://..." bun run migrate-server',
  );
  process.exit(1);
}

if (!TARGET_DB_URL) {
  console.error("❌ Не указан TARGET_DB_URL или POSTGRES_URL");
  process.exit(1);
}

async function migrateServer() {
  console.log("🚀 Начинаю перенос данных между серверами...\n");

  // @ts-expect-error
  const sourceClient = postgres(SOURCE_DB_URL!);
  // @ts-expect-error
  const targetClient = postgres(TARGET_DB_URL!);

  const sourceDb = drizzle(sourceClient);
  const targetDb = drizzle(targetClient);

  try {
    // Список таблиц для переноса в правильном порядке (учитывая зависимости)
    const tables = [
      "workspaces",
      "users",
      "workspace_members",
      "sessions",
      "accounts",
      "verification_tokens",
      "integrations",
      "vacancies",
      "vacancy_responses",
      "conversations",
      "messages",
      "files",
      "telegram_interview_scoring",
    ];

    for (const table of tables) {
      await migrateTable(sourceDb, targetDb, table);
    }

    console.log("\n🎉 Перенос данных завершён успешно!");
  } catch (error) {
    console.error("\n❌ Ошибка при переносе:", error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

async function migrateTable(sourceDb: any, targetDb: any, tableName: string) {
  try {
    console.log(`📦 Переношу таблицу: ${tableName}`);

    // Проверяем существование таблицы на источнике
    const sourceExists = await sourceDb.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `);

    if (!sourceExists.rows[0]?.exists) {
      console.log(`⚠️  Таблица ${tableName} не найдена на источнике, пропускаю`);
      return;
    }

    // Проверяем существование таблицы на целевом сервере
    const targetExists = await targetDb.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      );
    `);

    if (!targetExists.rows[0]?.exists) {
      console.log(
        `⚠️  Таблица ${tableName} не найдена на целевом сервере, пропускаю`,
      );
      return;
    }

    // Получаем количество записей
    const countResult = await sourceDb.execute(
      sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`),
    );
    const count = Number(countResult.rows[0]?.count || 0);

    if (count === 0) {
      console.log(`ℹ️  Таблица ${tableName} пуста, пропускаю`);
      return;
    }

    console.log(`   Найдено ${count} записей`);

    // Получаем все данные из источника
    const data = await sourceDb.execute(sql.raw(`SELECT * FROM ${tableName}`));

    if (data.rows.length === 0) {
      console.log(`ℹ️  Нет данных для переноса`);
      return;
    }

    // Получаем список колонок
    const columns = Object.keys(data.rows[0]);
    const columnsList = columns.join(", ");

    // Вставляем данные пакетами по 100 записей
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < data.rows.length; i += batchSize) {
      const batch = data.rows.slice(i, i + batchSize);

      for (const row of batch) {
        const values = columns
          .map((col) => {
            const value = row[col];
            if (value === null) return "NULL";
            if (typeof value === "string")
              return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString()}'`;
            if (typeof value === "object")
              return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          })
          .join(", ");

        try {
          await targetDb.execute(
            sql.raw(`
              INSERT INTO ${tableName} (${columnsList})
              VALUES (${values})
              ON CONFLICT DO NOTHING
            `),
          );
          inserted++;
        } catch (error: any) {
          console.log(`   ⚠️  Ошибка вставки записи: ${error.message}`);
        }
      }

      console.log(
        `   Прогресс: ${Math.min(i + batchSize, data.rows.length)}/${data.rows.length}`,
      );
    }

    console.log(`   ✅ Перенесено ${inserted} записей\n`);
  } catch (error) {
    console.error(`   ❌ Ошибка при переносе таблицы ${tableName}:`, error);
    throw error;
  }
}

migrateServer();
