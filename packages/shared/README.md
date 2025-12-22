# @qbs-autonaim/shared

Общий пакет для типов и утилит, используемых в `@qbs-autonaim/jobs` и `@qbs-autonaim/tg-client`.

## Назначение

Этот пакет был создан для устранения циклической зависимости между пакетами `jobs` и `tg-client`. Он содержит общие типы и утилиты, которые используются обоими пакетами.

## Структура

```
packages/shared/
├── src/
│   ├── types/           # Общие типы
│   │   ├── buffer.ts    # Типы для буферизации сообщений
│   │   └── conversation.ts  # Типы для метаданных conversation
│   ├── utils/           # Общие утилиты
│   │   └── conversation.ts  # Утилиты для работы с conversation
│   └── index.ts         # Главный экспорт
├── package.json
└── tsconfig.json
```

## Экспорты

### Типы

- `BufferedMessage` - Представляет одно буферизованное сообщение
- `BufferValue` - Представляет значение буфера для конкретного шага интервью
- `MessageBufferService` - Интерфейс сервиса буферизации сообщений
- `ConversationMetadata` - Метаданные conversation
- `QuestionAnswer` - Представляет пару вопрос-ответ в интервью

### Утилиты

- `getConversationMetadata(conversationId)` - Получает метаданные conversation
- `updateConversationMetadata(conversationId, updates)` - Обновляет метаданные conversation
- `getQuestionCount(conversationId)` - Получает количество заданных вопросов

## Использование

```typescript
import {
  type ConversationMetadata,
  type MessageBufferService,
  getConversationMetadata,
  getQuestionCount,
} from "@qbs-autonaim/shared";

// Получить метаданные
const metadata = await getConversationMetadata("conversation-id");

// Получить количество вопросов
const count = await getQuestionCount("conversation-id");
```

## Граф зависимостей

```
shared (базовый пакет)
  ↑
  ├── tg-client (зависит только от shared)
  ↑
  └── jobs (зависит от shared и tg-client)
```

## Зависимости

- `@qbs-autonaim/db` - Для работы с базой данных
- `zod` - Для валидации данных
