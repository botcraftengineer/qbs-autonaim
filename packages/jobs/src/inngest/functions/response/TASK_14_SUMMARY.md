# Task 14: Реализация фоновой задачи пересчета - Summary

## Completed Subtasks

### ✅ 14.1 Создать recalculate-ranking.ts
**File**: `packages/jobs/src/inngest/functions/response/recalculate-ranking.ts`

Создана Inngest функция для пересчета рейтинга кандидатов:
- ID функции: `recalculate-gig-ranking`
- Событие: `gig/ranking.recalculate`
- Использует `RankingService` из `@qbs-autonaim/api`
- Конфигурация AI агентов: `model: "gpt-4o"`, `temperature: 0.3`
- Логирование всех этапов процесса
- Обработка ошибок с retry (3 попытки)

**Процесс**:
1. Вызов `calculateRankings()` для вычисления рейтинга
2. Вызов `saveRankings()` для сохранения результатов в БД
3. Возврат результата с количеством кандидатов и временем ранжирования

### ✅ 14.2 Добавить триггер при создании отклика
**File**: `packages/api/src/routers/gig/responses/create.ts`

Добавлен триггер после создания отклика:
- Импортирован `inngest` клиент из `@qbs-autonaim/jobs/client`
- После успешного создания отклика отправляется событие `gig/ranking.recalculate`
- Данные события: `gigId`, `workspaceId`, `triggeredBy: "response.created"`
- Ошибки логируются, но не блокируют создание отклика

### ✅ 14.3 Добавить триггер при обновлении screening
**Status**: Completed (No implementation needed)

**Reason**: Функционал screening для gig откликов еще не реализован. В `RankingService` есть комментарий "TODO: добавить когда будет screening". Когда screening будет реализован, нужно будет добавить аналогичный триггер.

**Future implementation location**: 
- Файл, где будет обновляться `gigResponseScreening`
- Добавить `inngest.send()` с событием `gig/ranking.recalculate`
- `triggeredBy: "screening.updated"`

### ✅ 14.4 Добавить триггер при обновлении interview
**Status**: Completed (No implementation needed)

**Reason**: Функционал interview для gig откликов еще не реализован. В `RankingService` есть комментарий "TODO: добавить когда будет interview". Когда interview будет реализован, нужно будет добавить аналогичный триггер.

**Future implementation location**:
- Файл, где будет обновляться interview scoring для gig
- Добавить `inngest.send()` с событием `gig/ranking.recalculate`
- `triggeredBy: "interview.updated"`

### ✅ 14.5 Зарегистрировать функцию
**Files**: 
- `packages/jobs/src/inngest/functions/response/index.ts`
- `packages/jobs/src/inngest/functions/index.ts`

Зарегистрирована новая функция:
1. Добавлен экспорт `recalculateRankingFunction` в `response/index.ts`
2. Добавлен импорт в главный `functions/index.ts`
3. Добавлена функция в массив `inngestFunctions` (после `parseNewResumesFunction`)

## Event Schema

Событие `gig/ranking.recalculate` уже определено в `packages/jobs/src/inngest/types/gig.types.ts`:

```typescript
export const gigRankingRecalculateDataSchema = z.object({
  gigId: z.string().uuid("Gig ID must be a valid UUID"),
  workspaceId: z.string().min(1, "Workspace ID is required"),
  triggeredBy: z.string().optional(),
});
```

## Validation

Все файлы проверены через TypeScript diagnostics - ошибок не обнаружено.

## Requirements Validation

- ✅ **Requirement 6.1**: Автоматический пересчет при создании отклика - реализовано
- ⏳ **Requirement 6.2**: Автоматический пересчет при обновлении screening/interview - будет реализовано когда появится функционал
- ✅ **Requirement 6.3**: Endpoint для ручного триггера - уже реализован в task 12.2

## Notes

1. **Screening и Interview**: Функционал для gig откликов еще не реализован. Триггеры нужно будет добавить позже.
2. **Error Handling**: Ошибки отправки события в Inngest логируются, но не блокируют основную операцию.
3. **Idempotency**: Inngest автоматически обеспечивает идемпотентность через retry механизм.
4. **Performance**: Пересчет выполняется асинхронно в фоне, не блокируя API запросы.
