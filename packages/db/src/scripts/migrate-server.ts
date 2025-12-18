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

  const sourceClient = postgres(SOURCE_DB_URL!);
  const targetClient = postgres(TARGET_DB_URL!);

  try {
    // Список таблиц для переноса в правильном порядке (учитывая зависимости)
    const tables = [
      "accounts",
      "company_settings",
      "files",
      "integrations",
      "response_screenings",
      "telegram_interview_scorings",
      "telegram_sessions",
      "user_workspaces",
      "users",
      "workspaces",
      "workspace_invites",
      "vacancies",
      "vacancy_responses",
    ];

    for (const table of tables) {
      await migrateTable(sourceClient, targetClient, table);
    }

    // Переносим данные из telegram_conversations в conversations
    await migrateTelegramConversations(sourceClient, targetClient);

    // Переносим данные из telegram_messages в conversation_messages
    await migrateTelegramMessages(sourceClient, targetClient);

    console.log("\n🎉 Перенос данных завершён успешно!");
  } catch (error) {
    console.error("\n❌ Ошибка при переносе:", error);
    process.exit(1);
  } finally {
    await sourceClient.end();
    await targetClient.end();
  }
}

async function migrateTelegramConversations(
  sourceClient: any,
  targetClient: any,
) {
  try {
    console.log("📦 Переношу данные из telegram_conversations в conversations");

    // Проверяем существование исходной таблицы
    const sourceExists = await sourceClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_conversations'
      ) as exists
    `;

    if (!sourceExists[0]?.exists) {
      console.log(
        "⚠️  Таблица telegram_conversations не найдена на источнике, пропускаю",
      );
      return;
    }

    // Проверяем существование целевой таблицы
    const targetExists = await targetClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
      ) as exists
    `;

    if (!targetExists[0]?.exists) {
      console.log(
        "⚠️  Таблица conversations не найдена на целевом сервере, пропускаю",
      );
      return;
    }

    // Получаем данные из telegram_conversations
    const rows =
      await sourceClient`SELECT * FROM ${sourceClient("telegram_conversations")}`;

    if (rows.length === 0) {
      console.log("ℹ️  Нет данных для переноса");
      return;
    }

    console.log(`   Найдено ${rows.length} записей`);

    let inserted = 0;
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // Маппим поля из telegram_conversations в conversations
          // Заменяем undefined на null
          await targetClient.unsafe(
            `INSERT INTO conversations (
              id, 
              response_id, 
              candidate_name,
              username,
              status, 
              metadata,
              created_at, 
              updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            ON CONFLICT (id) DO NOTHING`,
            [
              row.id ?? null,
              row.response_id ?? null,
              row.candidate_name ?? null,
              row.username ?? null,
              row.status ?? null,
              row.metadata ?? null,
              row.created_at ?? null,
              row.updated_at ?? null,
            ],
          );
          inserted++;
        } catch (error: any) {
          console.log(`   ⚠️  Ошибка вставки записи: ${error.message}`);
        }
      }

      console.log(
        `   Прогресс: ${Math.min(i + batchSize, rows.length)}/${rows.length}`,
      );
    }

    console.log(`   ✅ Перенесено ${inserted} записей\n`);
  } catch (error) {
    console.error(
      "   ❌ Ошибка при переносе telegram_conversations в conversations:",
      error,
    );
    throw error;
  }
}

async function migrateTelegramMessages(sourceClient: any, targetClient: any) {
  try {
    console.log(
      "📦 Переношу данные из telegram_messages в conversation_messages",
    );

    // Проверяем существование исходной таблицы
    const sourceExists = await sourceClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_messages'
      ) as exists
    `;

    if (!sourceExists[0]?.exists) {
      console.log(
        "⚠️  Таблица telegram_messages не найдена на источнике, пропускаю",
      );
      return;
    }

    // Проверяем существование целевой таблицы
    const targetExists = await targetClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversation_messages'
      ) as exists
    `;

    if (!targetExists[0]?.exists) {
      console.log(
        "⚠️  Таблица conversation_messages не найдена на целевом сервере, пропускаю",
      );
      return;
    }

    // Получаем данные из telegram_messages
    const rows =
      await sourceClient`SELECT * FROM ${sourceClient("telegram_messages")}`;

    if (rows.length === 0) {
      console.log("ℹ️  Нет данных для переноса");
      return;
    }

    console.log(`   Найдено ${rows.length} записей`);

    let inserted = 0;
    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // Маппим поля из telegram_messages в conversation_messages
          await targetClient.unsafe(
            `INSERT INTO conversation_messages (
              id,
              conversation_id,
              sender,
              content_type,
              content,
              file_id,
              voice_duration,
              voice_transcription,
              telegram_message_id,
              created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
            ON CONFLICT (id) DO NOTHING`,
            [
              row.id ?? null,
              row.conversation_id ?? null,
              row.sender ?? null,
              row.content_type ?? null,
              row.content ?? null,
              row.file_id ?? null,
              row.voice_duration ?? null,
              row.voice_transcription ?? null,
              row.telegram_message_id ?? null,
              row.created_at ?? null,
            ],
          );
          inserted++;
        } catch (error: any) {
          console.log(`   ⚠️  Ошибка вставки записи: ${error.message}`);
        }
      }

      console.log(
        `   Прогресс: ${Math.min(i + batchSize, rows.length)}/${rows.length}`,
      );
    }

    console.log(`   ✅ Перенесено ${inserted} записей\n`);
  } catch (error) {
    console.error(
      "   ❌ Ошибка при переносе telegram_messages в conversation_messages:",
      error,
    );
    throw error;
  }
}

async function migrateTable(
  sourceClient: any,
  targetClient: any,
  tableName: string,
) {
  try {
    console.log(`📦 Переношу таблицу: ${tableName}`);

    // Проверяем существование таблицы на источнике
    const sourceExists = await sourceClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;

    if (!sourceExists[0]?.exists) {
      console.log(`⚠️  Таблица ${tableName} не найдена на источнике, пропускаю`);
      return;
    }

    // Проверяем существование таблицы на целевом сервере
    const targetExists = await targetClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${tableName}
      ) as exists
    `;

    if (!targetExists[0]?.exists) {
      console.log(
        `⚠️  Таблица ${tableName} не найдена на целевом сервере, пропускаю`,
      );
      return;
    }

    // Получаем количество записей
    const countResult =
      await sourceClient`SELECT COUNT(*) as count FROM ${sourceClient(tableName)}`;
    const count = Number(countResult[0]?.count ?? 0);

    if (count === 0) {
      console.log(`ℹ️  Таблица ${tableName} пуста, пропускаю`);
      return;
    }

    console.log(`   Найдено ${count} записей`);

    // Получаем все данные из источника
    const rows = await sourceClient`SELECT * FROM ${sourceClient(tableName)}`;

    if (rows.length === 0) {
      console.log(`ℹ️  Нет данных для переноса`);
      return;
    }

    // Получаем список колонок
    const columns = Object.keys(rows[0]);

    // Вставляем данные пакетами по 100 записей
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);

      for (const row of batch) {
        try {
          // Используем параметризованный запрос postgres
          const values = columns.map((col) => {
            const value = row[col];
            // Заменяем undefined на null
            if (value === undefined) {
              return null;
            }
            // Преобразуем объекты в JSON строки
            if (
              value !== null &&
              typeof value === "object" &&
              !(value instanceof Date)
            ) {
              return JSON.stringify(value);
            }
            return value;
          });
          const placeholders = columns
            .map((_, idx) => `$${idx + 1}`)
            .join(", ");
          const columnsList = columns.join(", ");

          await targetClient.unsafe(
            `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values,
          );
          inserted++;
        } catch (error: any) {
          console.log(`   ⚠️  Ошибка вставки записи: ${error.message}`);
        }
      }

      console.log(
        `   Прогресс: ${Math.min(i + batchSize, rows.length)}/${rows.length}`,
      );
    }

    console.log(`   ✅ Перенесено ${inserted} записей\n`);
  } catch (error) {
    console.error(`   ❌ Ошибка при переносе таблицы ${tableName}:`, error);
    throw error;
  }
}

migrateServer();
