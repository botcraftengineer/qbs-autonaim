# Инструкция по миграции messageBuffer в отдельную таблицу

## Проблема
`messageBuffer` хранился в JSON-поле `metadata` таблицы `conversations`, что приводило к race conditions и потере данных при одновременных обновлениях metadata.

## Решение
Создана отдельная таблица `message_buffers` с уникальным индексом по `(conversation_id, interview_step)`.

## Шаги миграции

### 1. Создать таблицу в базе данных

Выполнить SQL-скрипт:

```bash
psql -U your_user -d your_database -f packages/db/src/scripts/create-message-buffer-table.sql
```

Или вручную выполнить SQL:

```sql
CREATE TABLE IF NOT EXISTS message_buffers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  interview_step INTEGER NOT NULL,
  messages JSONB NOT NULL,
  flush_id VARCHAR(100),
  created_at BIGINT NOT NULL,
  last_updated_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS message_buffer_conversation_step_idx 
  ON message_buffers(conversation_id, interview_step);

CREATE INDEX IF NOT EXISTS message_buffer_user_idx 
  ON message_buffers(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS message_buffer_unique_idx 
  ON message_buffers(conversation_id, interview_step);
```

### 2. Перезапустить приложение

После создания таблицы перезапустить все сервисы:

```bash
bun run dev
```

## Преимущества

- ✅ Нет race conditions между буфером и другими полями metadata
- ✅ Атомарные операции с буфером
- ✅ Простой код без оптимистических блокировок
- ✅ Уникальный индекс предотвращает дублирование
- ✅ Автоматическое удаление при удалении conversation (CASCADE)

## Изменения в коде

- `packages/db/src/schema/conversation/message-buffer.ts` - новая схема таблицы
- `packages/jobs/src/services/buffer/postgres-buffer-service.ts` - упрощенная реализация
- `packages/shared/src/types/conversation.ts` - удалено поле `messageBuffer`
- `packages/shared/src/utils/conversation.ts` - удалена валидация `messageBuffer`
