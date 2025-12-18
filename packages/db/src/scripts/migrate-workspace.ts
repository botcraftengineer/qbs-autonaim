import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
// @ts-expect-error
import postgres from "postgres";

/**
 * Скрипт переноса данных конкретного workspace между серверами
 * Полезно для переноса данных одного клиента
 *
 * Использование:
 * SOURCE_DB_URL="..." TARGET_DB_URL="..." WORKSPACE_ID="..." bun run migrate-workspace
 */

const SOURCE_DB_URL = process.env.SOURCE_DB_URL;
const TARGET_DB_URL = process.env.TARGET_DB_URL || process.env.POSTGRES_URL;
const WORKSPACE_ID = process.env.WORKSPACE_ID;

if (!SOURCE_DB_URL || !TARGET_DB_URL || !WORKSPACE_ID) {
  console.error("❌ Не указаны необходимые переменные");
  console.log("Использование:");
  console.log(
    'SOURCE_DB_URL="..." TARGET_DB_URL="..." WORKSPACE_ID="..." bun run migrate-workspace',
  );
  process.exit(1);
}

async function migrateWorkspace() {
  console.log(`🚀 Переношу workspace: ${WORKSPACE_ID}\n`);

  // @ts-expect-error
  const sourceClient = postgres(SOURCE_DB_URL!);
  // @ts-expect-error
  const targetClient = postgres(TARGET_DB_URL!);

  const sourceDb = drizzle(sourceClient);
  const targetDb = drizzle(targetClient);

  try {
    // 1. Workspace
    await copyWorkspace(sourceDb, targetDb);

    // 2. Workspace members
    await copyWorkspaceMembers(sourceDb, targetDb);

    // 3. Integrations
    await copyIntegrations(sourceDb, targetDb);

    // 4. Vacancies
    const vacancyIds = await copyVacancies(sourceDb, targetDb);

    // 5. Vacancy responses
    const responseIds = await copyVacancyResponses(
      sourceDb,
      targetDb,
      vacancyIds,
    );

    // 6. Conversations
    const conversationIds = await copyConversations(
      sourceDb,
      targetDb,
      responseIds,
    );

    // 7. Messages
    await copyMessages(sourceDb, targetDb, conversationIds);

    // 8. Files
    await copyFiles(sourceDb, targetDb);

    console.log("\n🎉 Workspace перенесён успешно!");
  } catch (error) {
    console.error("\n❌ Ошибка:", error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

async function copyWorkspace(sourceDb: any, targetDb: any) {
  console.log("📦 Копирую workspace...");
  const data = await sourceDb.execute(
    sql.raw(`SELECT * FROM workspaces WHERE id = '${WORKSPACE_ID}'`),
  );

  if (data.rows.length === 0) {
    throw new Error(`Workspace ${WORKSPACE_ID} не найден`);
  }

  await insertRows(targetDb, "workspaces", data.rows);
  console.log(`   ✅ Workspace скопирован\n`);
}

async function copyWorkspaceMembers(sourceDb: any, targetDb: any) {
  console.log("👥 Копирую участников workspace...");
  const data = await sourceDb.execute(
    sql.raw(
      `SELECT * FROM workspace_members WHERE workspace_id = '${WORKSPACE_ID}'`,
    ),
  );

  await insertRows(targetDb, "workspace_members", data.rows);
  console.log(`   ✅ Скопировано ${data.rows.length} участников\n`);
}

async function copyIntegrations(sourceDb: any, targetDb: any) {
  console.log("🔌 Копирую интеграции...");
  const data = await sourceDb.execute(
    sql.raw(
      `SELECT * FROM integrations WHERE workspace_id = '${WORKSPACE_ID}'`,
    ),
  );

  await insertRows(targetDb, "integrations", data.rows);
  console.log(`   ✅ Скопировано ${data.rows.length} интеграций\n`);
}

async function copyVacancies(sourceDb: any, targetDb: any): Promise<string[]> {
  console.log("💼 Копирую вакансии...");
  const data = await sourceDb.execute(
    sql.raw(`SELECT * FROM vacancies WHERE workspace_id = '${WORKSPACE_ID}'`),
  );

  await insertRows(targetDb, "vacancies", data.rows);
  const ids = data.rows.map((r: any) => r.id);
  console.log(`   ✅ Скопировано ${data.rows.length} вакансий\n`);
  return ids;
}

async function copyVacancyResponses(
  sourceDb: any,
  targetDb: any,
  vacancyIds: string[],
): Promise<string[]> {
  if (vacancyIds.length === 0) return [];

  console.log("📝 Копирую отклики...");
  const data = await sourceDb.execute(
    sql.raw(
      `SELECT * FROM vacancy_responses WHERE vacancy_id IN (${vacancyIds.map((id) => `'${id}'`).join(",")})`,
    ),
  );

  await insertRows(targetDb, "vacancy_responses", data.rows);
  const ids = data.rows.map((r: any) => r.id);
  console.log(`   ✅ Скопировано ${data.rows.length} откликов\n`);
  return ids;
}

async function copyConversations(
  sourceDb: any,
  targetDb: any,
  responseIds: string[],
): Promise<string[]> {
  if (responseIds.length === 0) return [];

  console.log("💬 Копирую беседы...");
  const data = await sourceDb.execute(
    sql.raw(
      `SELECT * FROM conversations WHERE response_id IN (${responseIds.map((id) => `'${id}'`).join(",")})`,
    ),
  );

  await insertRows(targetDb, "conversations", data.rows);
  const ids = data.rows.map((r: any) => r.id);
  console.log(`   ✅ Скопировано ${data.rows.length} бесед\n`);
  return ids;
}

async function copyMessages(
  sourceDb: any,
  targetDb: any,
  conversationIds: string[],
) {
  if (conversationIds.length === 0) return;

  console.log("📨 Копирую сообщения...");
  const data = await sourceDb.execute(
    sql.raw(
      `SELECT * FROM messages WHERE conversation_id IN (${conversationIds.map((id) => `'${id}'`).join(",")})`,
    ),
  );

  await insertRows(targetDb, "messages", data.rows);
  console.log(`   ✅ Скопировано ${data.rows.length} сообщений\n`);
}

async function copyFiles(sourceDb: any, targetDb: any) {
  console.log("📎 Копирую файлы...");
  const data = await sourceDb.execute(
    sql.raw(`SELECT * FROM files WHERE workspace_id = '${WORKSPACE_ID}'`),
  );

  await insertRows(targetDb, "files", data.rows);
  console.log(`   ✅ Скопировано ${data.rows.length} файлов\n`);
}

async function insertRows(db: any, tableName: string, rows: any[]) {
  if (rows.length === 0) return;

  const columns = Object.keys(rows[0]);
  const columnsList = columns.join(", ");

  for (const row of rows) {
    const values = columns
      .map((col) => {
        const value = row[col];
        if (value === null) return "NULL";
        if (typeof value === "string") return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        if (typeof value === "object")
          return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
        return value;
      })
      .join(", ");

    try {
      await db.execute(
        sql.raw(
          `INSERT INTO ${tableName} (${columnsList}) VALUES (${values}) ON CONFLICT DO NOTHING`,
        ),
      );
    } catch (error: any) {
      console.log(`   ⚠️  Ошибка вставки в ${tableName}: ${error.message}`);
    }
  }
}

migrateWorkspace();
