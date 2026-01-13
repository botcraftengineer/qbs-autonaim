# Управление счетчиками откликов для Gigs

## Проблемы и решения

### Проблемы, которые были решены:

1. **Отсутствие cascade delete** - при удалении gig responses оставались "сиротами"
2. **Нет API для удаления responses** - нельзя было удалить отдельный отклик
3. **Неэффективная синхронизация** - пересчет счетчиков работал медленно

### Решенные проблемы:

1. ✅ Добавлен cascade delete для responses при удалении gig
2. ✅ Добавлен роут `gig.responses.delete` для удаления отдельных откликов
3. ✅ Улучшена логика синхронизации счетчиков
4. ✅ Добавлен CLI скрипт для массового пересчета

## API роуты

### Удаление отклика
```typescript
trpc.gig.responses.delete.mutate({
  responseId: "response-id",
  workspaceId: "workspace-id"
})
```

### Синхронизация счетчиков одного gig
```typescript
trpc.gig.syncResponseCounts.mutate({
  gigId: "gig-id",
  workspaceId: "workspace-id",
  forceSync: false // true для принудительной синхронизации
})
```

### Синхронизация счетчиков всех gigs в workspace
```typescript
trpc.gig.syncAllResponseCounts.mutate({
  workspaceId: "workspace-id",
  forceSync: false // true для принудительной синхронизации
})
```

### Проверка синхронизации
```typescript
const counts = await trpc.gig.responses.count.query({
  gigId: "gig-id",
  workspaceId: "workspace-id"
})
// Возвращает: total, new, gigResponses, gigNewResponses, isSynced
```

## CLI команды

### Пересчет счетчиков для workspace
```bash
cd packages/api
bun run sync-gig-counts <workspaceId> [--force]
```

### Пересчет счетчиков для всех workspaces
```bash
cd packages/api
bun run sync-gig-counts --all [--force]
```

### Параметры CLI:
- `workspaceId` - ID workspace для обработки конкретного workspace
- `--all` - Обработать все workspaces
- `--force` - Принудительно обновить все счетчики (даже если они совпадают)

## Примеры использования

### 1. Проверка и исправление счетчиков
```typescript
// Проверить статус синхронизации
const { isSynced } = await trpc.gig.responses.count.query({...});

// Если не синхронизировано - исправить
if (!isSynced) {
  await trpc.gig.syncResponseCounts.mutate({...});
}
```

### 2. Массовый пересчет для workspace
```bash
# Разовый пересчет
bun run sync-gig-counts ws_demo_001

# Принудительный пересчет всех
bun run sync-gig-counts --all --force
```

### 3. Удаление проблемных откликов
```typescript
// Найти и удалить дубликаты или спам
await trpc.gig.responses.delete.mutate({
  responseId: "problem-response-id",
  workspaceId: "workspace-id"
});
```

## Мониторинг

### Проверка консистентности данных
```sql
-- Найти gigs с несинхронизированными счетчиками
SELECT
  g.id,
  g.title,
  g.responses as gig_responses,
  g.new_responses as gig_new_responses,
  COUNT(r.id) as actual_responses,
  COUNT(CASE WHEN r.status = 'NEW' THEN 1 END) as actual_new_responses
FROM gigs g
LEFT JOIN responses r ON r.entity_type = 'gig' AND r.entity_id = g.id
GROUP BY g.id, g.title, g.responses, g.new_responses
HAVING
  g.responses != COUNT(r.id) OR
  g.new_responses != COUNT(CASE WHEN r.status = 'NEW' THEN 1 END);
```

## Лучшие практики

1. **Регулярная синхронизация** - запускайте CLI скрипт еженедельно
2. **Мониторинг** - проверяйте `isSynced` флаг в API
3. **Логирование** - логируйте изменения счетчиков для аудита
4. **Транзакции** - все операции со счетчиками в транзакциях

## Миграции

Примените миграцию для добавления cascade delete:
```sql
-- В файле packages/db/drizzle/0003_add_cascade_delete_responses.sql
ALTER TABLE "responses"
ADD CONSTRAINT "responses_entity_id_gig_fk"
FOREIGN KEY ("entity_id") REFERENCES "gigs"("id")
ON DELETE CASCADE
ON UPDATE NO ACTION;
```