# Design Document

## Overview

Исправление race condition в функции `updateConversationMetadata` путем использования транзакций базы данных и оптимистичной блокировки. Решение обеспечит атомарность операций обновления метаданных и предотвратит потерю данных при конкурентном доступе.

## Architecture

Используем оптимистичную блокировку с полем `metadata_version` для минимизации блокировок и максимизации производительности. Транзакция будет выполнять:
1. SELECT текущих метаданных и версии
2. Merge существующих данных с обновлениями
3. UPDATE с проверкой версии в WHERE clause
4. Инкремент версии при успешном обновлении

## Components and Interfaces

### updateConversationMetadata (обновленная версия)

```typescript
async function updateConversationMetadata(
  conversationId: string,
  updates: Partial<ConversationMetadata>,
  options?: { maxRetries?: number }
): Promise<boolean>
```

**Параметры:**
- `conversationId`: ID разговора
- `updates`: Частичные обновления метаданных
- `options.maxRetries`: Максимальное количество попыток (по умолчанию 3)

**Возвращает:** `true` при успехе, `false` при неудаче

### Внутренняя функция updateWithOptimisticLock

```typescript
async function updateWithOptimisticLock(
  conversationId: string,
  updates: Partial<ConversationMetadata>
): Promise<boolean>
```

Выполняет одну попытку обновления с оптимистичной блокировкой.

## Data Models

### Изменения в схеме conversation

```typescript
// Добавить поле metadata_version
metadata_version: integer("metadata_version").default(1).notNull()
```

### ConversationMetadata (без изменений)

Тип остается прежним, изменения только в логике обновления.

## Correctness Properties

*Свойство корректности — это характеристика или поведение, которое должно выполняться во всех допустимых выполнениях системы.*

### Property 1: Атомарность обновлений

*For any* два конкурентных обновления метаданных одного разговора, оба обновления должны быть сохранены без потери данных.

**Validates: Requirements 1.1, 1.2**

### Property 2: Консистентность версий

*For any* успешное обновление метаданных, поле metadata_version должно быть инкрементировано ровно на 1.

**Validates: Requirements 5.3**

### Property 3: Идемпотентность при конфликтах

*For any* конфликт версий, система должна повторить попытку обновления с актуальными данными.

**Validates: Requirements 2.3, 4.2**

### Property 4: Обратная совместимость

*For any* существующий код, использующий updateConversationMetadata, функция должна работать без изменений в вызывающем коде.

**Validates: Requirements 3.1, 3.2**

## Error Handling

1. **Конфликт версий**: Повторная попытка с экспоненциальной задержкой
2. **Превышение лимита попыток**: Возврат `false` и логирование ошибки
3. **Ошибка БД**: Откат транзакции, возврат `false`, логирование
4. **Невалидный JSON**: Обработка как пустой объект метаданных

## Testing Strategy

### Unit Tests

1. Тест успешного обновления метаданных
2. Тест обработки конфликта версий
3. Тест превышения лимита попыток
4. Тест обратной совместимости API

### Property-Based Tests

Минимум 100 итераций для каждого теста.

**Property Test 1: Concurrent Updates Preservation**
- **Property 1: Атомарность обновлений**
- **Validates: Requirements 1.1**
- Генерировать случайные пары обновлений, выполнять конкурентно, проверять что оба сохранены

**Property Test 2: Version Increment Consistency**
- **Property 2: Консистентность версий**
- **Validates: Requirements 5.3**
- Генерировать случайное количество последовательных обновлений, проверять что версия увеличилась на N

**Property Test 3: Retry Mechanism**
- **Property 3: Идемпотентность при конфликтах**
- **Validates: Requirements 2.3**
- Симулировать конфликты версий, проверять что система корректно повторяет попытки
