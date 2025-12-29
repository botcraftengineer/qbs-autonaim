# Централизованная обработка ошибок

## Обзор

Система централизованной обработки ошибок для всех tRPC эндпоинтов, обеспечивающая:
- Единообразные HTTP коды статуса
- Конкретные сообщения об ошибках на русском языке
- Автоматическое логирование всех ошибок
- Уведомление администраторов о критических ошибках

## Использование

### Базовый пример

```typescript
import { protectedProcedure } from "../../trpc";
import { createErrorHandler } from "../../utils/error-handler";

export const myEndpoint = protectedProcedure
  .input(mySchema)
  .mutation(async ({ input, ctx }) => {
    const errorHandler = createErrorHandler(
      ctx.auditLogger,
      ctx.session.user.id,
      ctx.ipAddress,
      ctx.userAgent,
    );

    try {
      // Ваша логика
      const data = await someOperation();
      
      if (!data) {
        await errorHandler.handleNotFoundError("Ресурс", {
          resourceId: input.id,
        });
      }
      
      return data;
    } catch (error) {
      // Пропускаем уже обработанные TRPC ошибки
      if (error instanceof Error && error.message.includes("TRPC")) {
        throw error;
      }
      // Обрабатываем неожиданные ошибки
      await errorHandler.handleDatabaseError(error as Error, {
        operation: "my_operation",
      });
    }
  });
```

### Доступные методы

#### handleValidationError
Для ошибок валидации входных данных (400 Bad Request)
```typescript
await errorHandler.handleValidationError(
  "Некорректные данные",
  { field: "email", value: input.email }
);
```

#### handleNotFoundError
Для отсутствующих ресурсов (404 Not Found)
```typescript
await errorHandler.handleNotFoundError("Вакансия", {
  vacancyId: input.id,
});
```

#### handleAuthorizationError
Для ошибок доступа (403 Forbidden)
```typescript
await errorHandler.handleAuthorizationError("workspace", {
  workspaceId: input.workspaceId,
  userId: ctx.session.user.id,
});
```

#### handleConflictError
Для конфликтов (409 Conflict), например дубликатов
```typescript
await errorHandler.handleConflictError(
  "Отклик от этого фрилансера уже существует",
  { platformProfileUrl: input.profileUrl }
);
```

#### handleAIServiceError
Для ошибок AI-сервисов (500 Internal Server Error, HIGH severity)
```typescript
await errorHandler.handleAIServiceError(error, {
  operation: "analyze_response",
  responseId: input.responseId,
});
```

#### handleDatabaseError
Для ошибок базы данных (500 Internal Server Error, CRITICAL severity)
```typescript
await errorHandler.handleDatabaseError(error, {
  operation: "create_vacancy",
  vacancyId: input.id,
});
```

#### handleInternalError
Для внутренних ошибок сервера (500 Internal Server Error, HIGH severity)
```typescript
await errorHandler.handleInternalError(
  new Error("Unexpected state"),
  { context: "some_context" }
);
```

## Категории ошибок

- **VALIDATION** - Некорректные входные данные
- **AUTHENTICATION** - Проблемы аутентификации
- **AUTHORIZATION** - Нет доступа к ресурсу
- **NOT_FOUND** - Ресурс не найден
- **CONFLICT** - Конфликт (дубликат)
- **AI_SERVICE** - Ошибка AI-сервиса
- **DATABASE** - Ошибка базы данных
- **EXTERNAL_API** - Ошибка внешнего API
- **INTERNAL** - Внутренняя ошибка

## Уровни критичности

- **LOW** - Обычные ошибки (валидация, not found)
- **MEDIUM** - Ошибки доступа
- **HIGH** - Ошибки AI-сервисов, внутренние ошибки
- **CRITICAL** - Ошибки базы данных

Ошибки уровня HIGH и CRITICAL автоматически отправляют уведомления администраторам.

## Логирование

Все ошибки автоматически логируются в таблицу `audit_log` с полным контекстом:
- Категория и уровень критичности
- Сообщение для пользователя и техническое сообщение
- Контекст (параметры запроса, ID ресурсов)
- Stack trace (для исключений)
- IP-адрес и User-Agent
- ID пользователя (если доступен)

## Требования

Реализация соответствует требованиям 14.1-14.5:
- ✅ 14.1: Возврат соответствующих HTTP кодов статуса
- ✅ 14.2: Предоставление конкретных сообщений об ошибках
- ✅ 14.3: Логирование ошибок для отладки
- ✅ 14.5: Автоматическое уведомление администраторов о критических ошибках
