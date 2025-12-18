# Руководство по миграции схемы базы данных

## Ситуация
У вас уже есть база данных с таблицами `telegram_conversations` и `telegram_messages` и данными в них.
Нужно переименовать таблицы в `conversations` и `messages`.

## Последовательность действий

### 1. Создать новые таблицы (без удаления старых)

```bash
cd packages/db
bun run push
```

Эта команда:
- Создаст новые таблицы `conversations` и `messages`
- НЕ удалит старые таблицы `telegram_conversations` и `telegram_messages`
- Применит изменения к схеме БД

### 2. Мигрировать данные из старых таблиц в новые

```bash
# Миграция conversations
bun run migrate-conversations

# Миграция messages
bun run migrate-messages
```

Эти скрипты:
- Скопируют все данные из старых таблиц в новые
- Переименуют старые таблицы в `*_backup`
- Сохранят данные для безопасности

### 3. Проверить данные

Подключитесь к базе данных и проверьте:

```sql
-- Проверить количество записей
SELECT COUNT(*) FROM conversations;
SELECT COUNT(*) FROM telegram_conversations_backup;

SELECT COUNT(*) FROM messages;
SELECT COUNT(*) FROM telegram_messages_backup;

-- Проверить несколько записей
SELECT * FROM conversations LIMIT 5;
SELECT * FROM messages LIMIT 5;
```

### 4. Удалить старые таблицы (опционально)

После проверки, что всё работает корректно:

```sql
DROP TABLE telegram_conversations_backup;
DROP TABLE telegram_messages_backup;
```

## Альтернативный подход (если push не работает)

Если `bun run push` пытается удалить старые таблицы, используйте ручной SQL:

```sql
-- 1. Создать новые таблицы
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  response_id UUID NOT NULL UNIQUE REFERENCES vacancy_responses(id) ON DELETE CASCADE,
  candidate_name VARCHAR(500),
  username VARCHAR(100),
  status conversation_status DEFAULT 'ACTIVE' NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender message_sender NOT NULL,
  content_type message_content_type DEFAULT 'TEXT' NOT NULL,
  content TEXT NOT NULL,
  file_id UUID REFERENCES files(id) ON DELETE SET NULL,
  voice_duration VARCHAR(20),
  voice_transcription TEXT,
  telegram_message_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 2. Запустить скрипты миграции данных
-- (см. шаг 2 выше)
```

## Откат изменений

Если что-то пошло не так:

```sql
-- Удалить новые таблицы
DROP TABLE messages;
DROP TABLE conversations;

-- Вернуть старые имена
ALTER TABLE telegram_conversations_backup RENAME TO telegram_conversations;
ALTER TABLE telegram_messages_backup RENAME TO telegram_messages;
```

## Важные замечания

- ✅ Скрипты миграции безопасны - они не удаляют данные
- ✅ Старые таблицы сохраняются как backup
- ✅ Код продолжит работать благодаря реэкспортам в схеме
- ⚠️ Делайте бэкап базы данных перед миграцией!
