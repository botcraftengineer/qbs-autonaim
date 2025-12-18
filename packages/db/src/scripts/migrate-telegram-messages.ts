import { sql } from "drizzle-orm";
import { db } from "../client";

/**
 * Скрипт миграции данных из telegram_messages в messages
 * Переносит все сообщения из старой таблицы в новую
 */
async function migrateTelegramMessages() {
  try {
    console.log(
      "🔄 Начинаю миграцию данных из telegram_messages в messages...",
    );

    // Проверяем существование старой таблицы
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'telegram_messages'
      );
    `);

    const exists = tableExists.rows[0]?.exists;

    if (!exists) {
      console.log(
        "ℹ️  Таблица telegram_messages не найдена. Миграция не требуется.",
      );
      process.exit(0);
    }

    // Проверяем наличие данных в старой таблице
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM telegram_messages;
    `);

    const count = Number(countResult.rows[0]?.count || 0);

    if (count === 0) {
      console.log("ℹ️  Таблица telegram_messages пуста. Нечего мигрировать.");
      process.exit(0);
    }

    console.log(`📊 Найдено ${count} сообщений для миграции`);

    // Копируем данные из telegram_messages в messages
    await db.execute(sql`
      INSERT INTO messages (
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
      )
      SELECT 
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
      FROM telegram_messages
      ON CONFLICT (id) DO NOTHING;
    `);

    // Проверяем количество перенесенных записей
    const migratedCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages;
    `);

    const migrated = Number(migratedCount.rows[0]?.count || 0);

    console.log(
      `✅ Успешно перенесено ${migrated} сообщений в таблицу messages`,
    );

    // Переименовываем старую таблицу для безопасности
    console.log(
      "🔄 Переименовываю старую таблицу в telegram_messages_backup...",
    );

    await db.execute(sql`
      ALTER TABLE telegram_messages 
      RENAME TO telegram_messages_backup;
    `);

    console.log("✅ Миграция завершена успешно!");
    console.log("ℹ️  Старая таблица сохранена как telegram_messages_backup");
    console.log(
      "ℹ️  Вы можете удалить её позже командой: DROP TABLE telegram_messages_backup;",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Ошибка при миграции данных:", error);
    process.exit(1);
  }
}

migrateTelegramMessages();
