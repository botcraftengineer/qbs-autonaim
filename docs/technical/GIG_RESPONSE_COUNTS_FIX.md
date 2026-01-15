# Исправление подсчета откликов для Gig

## Проблема

Счетчики откликов (`responses` и `newResponses`) в таблице `gig` могли рассинхронизироваться с реальными данными при изменении статусов откликов.

## Решение

### 1. Добавлена логика обновления счетчиков при изменении статуса

**Файлы:**
- `packages/api/src/routers/gig/responses/accept.ts`
- `packages/api/src/routers/gig/responses/reject.ts`
- `packages/api/src/routers/gig/responses/update-status.ts`

**Изменения:**
- При изменении статуса отклика с `NEW` на другой — счетчик `newResponses` уменьшается
- При изменении статуса отклика на `NEW` — счетчик `newResponses` увеличивается
- Используется `GREATEST()` для предотвращения отрицательных значений

### 2. Добавлен метод подсчета откликов

**Файл:** `packages/api/src/routers/gig/responses/count.ts`

**API:** `gig.responses.count`

**Возвращает:**
```typescript
{
  total: number;           // Реальное количество откликов
  new: number;             // Реальное количество новых откликов
  gigResponses: number;    // Значение из таблицы gig
  gigNewResponses: number; // Значение из таблицы gig
  isSynced: boolean;       // Флаг синхронизации
}
```

### 3. Добавлен метод синхронизации счетчиков для одного gig

**Файл:** `packages/api/src/routers/gig/sync-response-counts.ts`

**API:** `gig.syncResponseCounts`

**Использование:**
```typescript
const result = await trpc.gig.syncResponseCounts.mutate({
  gigId: "uuid",
  workspaceId: "workspace-id"
});
```

**Возвращает:**
```typescript
{
  total: number;
  new: number;
  previousTotal: number;
  previousNew: number;
  updated: true;
}
```

### 4. Добавлен метод массовой синхронизации

**Файл:** `packages/api/src/routers/gig/sync-all-response-counts.ts`

**API:** `gig.syncAllResponseCounts`

**Использование:**
```typescript
const result = await trpc.gig.syncAllResponseCounts.mutate({
  workspaceId: "workspace-id"
});
```

**Возвращает:**
```typescript
{
  totalGigs: number;
  updatedGigs: number;
  results: Array<{
    gigId: string;
    previousTotal: number;
    newTotal: number;
    previousNew: number;
    newNew: number;
    updated: true;
  }>;
}
```

## Где отображается информация о количестве откликов

### 1. Страница списка gig
**Файл:** `apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/page.tsx`

- Статистика в шапке (всего откликов, новых откликов)
- Сортировка по откликам
- Карточки gig показывают количество откликов

### 2. Карточка gig
**Файл:** `apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/components/gig-card.tsx`

- Бейдж с количеством новых откликов
- Ссылка на отклики с количеством
- Иконка с количеством откликов

### 3. Детальная страница gig
**Файл:** `apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/gig-detail-client.tsx`

- Статистика в боковой панели
- Количество откликов
- Количество новых откликов (если > 0)

### 4. Страница списка откликов
**Файл:** `apps/app/src/app/(dashboard)/orgs/[orgSlug]/workspaces/[slug]/gigs/[gigId]/responses/page.tsx`

- Бейдж с общим количеством откликов
- Табы с количеством по статусам
- Фильтрация и подсчет

## Логика работы счетчиков

### При создании отклика
```typescript
// packages/api/src/routers/gig/responses/create.ts
responses: sql`COALESCE(${gig.responses}, 0) + 1`
newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`
```

### При изменении статуса с NEW на другой
```typescript
// accept.ts, reject.ts
if (wasNew) {
  newResponses: sql`GREATEST(COALESCE(${gig.newResponses}, 0) - 1, 0)`
}
```

### При изменении статуса на NEW
```typescript
// update-status.ts
if (!wasNew && isNew) {
  newResponses: sql`COALESCE(${gig.newResponses}, 0) + 1`
}
```

## Проверка синхронизации

Для проверки синхронизации счетчиков используйте метод `count`:

```typescript
const { data } = useQuery(
  trpc.gig.responses.count.queryOptions({
    gigId: "uuid",
    workspaceId: "workspace-id"
  })
);

if (!data.isSynced) {
  console.warn("Счетчики рассинхронизированы!");
  console.log("Реальное количество:", data.total);
  console.log("В таблице gig:", data.gigResponses);
}
```

## Исправление рассинхронизации

### Для одного gig
```typescript
await trpc.gig.syncResponseCounts.mutate({
  gigId: "uuid",
  workspaceId: "workspace-id"
});
```

### Для всех gig в workspace
```typescript
const result = await trpc.gig.syncAllResponseCounts.mutate({
  workspaceId: "workspace-id"
});

console.log(`Обновлено ${result.updatedGigs} из ${result.totalGigs} заданий`);
```

## Тестирование

1. Создайте gig
2. Добавьте несколько откликов
3. Проверьте счетчики на странице списка gig
4. Измените статус откликов (accept/reject)
5. Убедитесь, что счетчик новых откликов уменьшился
6. Проверьте синхронизацию через `gig.responses.count`

## Примечания

- Счетчики обновляются атомарно с использованием SQL функций
- `GREATEST()` предотвращает отрицательные значения
- `COALESCE()` обрабатывает NULL значения
- Каскадное удаление настроено правильно (`onDelete: "cascade"`)
- При удалении gig все отклики удаляются автоматически
