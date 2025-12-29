# Security Utilities

## Rate Limiting

```typescript
import { checkRateLimit } from "@qbs-autonaim/lib";

const result = checkRateLimit(workspaceId, 10, 60_000);
if (!result.allowed) {
  // Лимит превышен
  return res.status(429).json({
    error: "Too many requests",
    retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
  });
}
```

## Prompt Sanitization

```typescript
import { 
  sanitizePromptText, 
  truncateText,
  sanitizeConversationMessage 
} from "@qbs-autonaim/lib";

// Санитизация текста
const clean = sanitizePromptText(userInput);

// Обрезка до лимита
const limited = truncateText(clean, 5000);

// Санитизация истории диалога
const cleanHistory = conversationHistory.map(msg => 
  sanitizeConversationMessage(msg)
);
```

## Features

### Rate Limiter
- In-memory sliding window
- Автоматическая очистка устаревших записей
- Настраиваемые лимиты и окна времени

### Prompt Sanitizer
- Удаление управляющих символов
- Ограничение повторяющихся спецсимволов
- Защита от prompt injection
- Обрезка длинных блоков кода
- Нормализация пробелов и переносов строк
