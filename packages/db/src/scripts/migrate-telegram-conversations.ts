import { sql } from "drizzle-orm";
import { db } from "../client";

/**
 * Скрипт миграции данных из telegram_conversations в conversations
 * Переносит все данные из старой таблицы в новую
 */
async function migrateTelegramConversations() {
  try {
    console.log(
      "🔄 Начинаю миграцию данных из telegram_conversations в conversations...",
    );

    // Проверяем существование старой таблицы
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_conversations'
      );
    `);

    const exists = tableExists.rows[0]?.exists;

    if (!exists) {
      console.log(
        "ℹ️  Таблица telegram_conversations не найдена. Миграция не требуется.",
      );
      process.exit(0);
    }

    // Проверяем наличие данных в старой таблице
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM telegram_conversations;
    `);

    const count = Number(countResult.rows[0]?.count || 0);

    if (count === 0) {
      console.log(
        "ℹ️  Таблица telegram_conversations пуста. Нечего мигрировать.",
      );
      process.exit(0);
    }

    console.log(`📊 Найдено ${count} записей для миграции`);

    // Проверяем существование новой таблицы
    const newTableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
      );
    `);

    if (!newTableExists.rows[0]?.exists) {
      console.log("❌ Таблица conversations не найдена!");
      console.log("ℹ️  Сначала выполните: bun run push");
      process.exit(1);
    }

    // Копируем данные из telegram_conversations в conversations
    // Убираем chat_id, так как теперь используем только responseId и username
    await db.execute(sql`
      INSERT INTO conversations (
        id,
        response_id,
        candidate_name,
        username,
        status,
        metadata,
        created_at,
        updated_at
      )
      SELECT 
        id,
        response_id,
        candidate_name,
        username,
        status,
        metadata,
        created_at,
        updated_at
      FROM telegram_conversations
      WHERE response_id IS NOT NULL
      ON CONFLICT (response_id) DO NOTHING;
    `);

    // Проверяем количество перенесенных записей
    const migratedCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM conversations;
    `);

    const migrated = Number(migratedCount.rows[0]?.count || 0);

    console.log(
      `✅ Успешно перенесено ${migrated} записей в таблицу conversations`,
    );

    // Опционально: переименовываем старую таблицу для безопасности
    console.log(
      "🔄 Переименовываю старую таблицу в telegram_conversations_backup...",
    );

    await db.execute(sql`
      ALTER TABLE telegram_conversations 
      RENAME TO telegram_conversations_backup;
    `);

    console.log("✅ Миграция завершена успешно!");
    console.log(
      "ℹ️  Старая таблица сохранена как telegram_conversations_backup",
    );
    console.log(
      "ℹ️  Вы можете удалить её позже командой: DROP TABLE telegram_conversations_backup;",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при миграции данных:", error);
    process.exit(1);
  }
}

migrateTelegramConversations();
