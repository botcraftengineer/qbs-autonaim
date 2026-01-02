# Design Document: AI-помощник для создания вакансий

## Overview

AI-помощник для создания вакансий - это интерактивный чат-интерфейс, который помогает рекрутерам создавать структурированные вакансии через естественный диалог. Система использует AI для преобразования свободного текста в структурированный документ вакансии с полями title, description, requirements, responsibilities, conditions и настройками бота.

Архитектура основана на паттерне, используемом в существующем помощнике для создания разовых заданий (gig), но адаптирована для специфики вакансий.

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   React Client  │
│  (Chat UI)      │
└────────┬────────┘
         │ HTTP POST
         │ (fetch API)
         ▼
┌─────────────────┐
│  Next.js API    │
│  Route Handler  │
│  /api/vacancy/  │
│  chat-generate  │
└────────┬────────┘
         │
         ├─ Auth Check (getSession)
         ├─ Rate Limiting
         ├─ Input Validation (Zod)
         ├─ Workspace Access Check
         │
         ▼
┌─────────────────┐
│  AI Client      │
│  (streamText)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  OpenAI/        │
│  DeepSeek API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ReadableStream │
│  (SSE)          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Client   │
│  (Document      │
│   Updates)      │
└─────────────────┘
```

### Data Flow

1. **User Input**: Пользователь вводит сообщение в чат
2. **Request**: Клиент отправляет POST запрос с message, currentDocument, conversationHistory
3. **Validation**: Сервер валидирует входные данные и проверяет авторизацию
4. **AI Generation**: Сервер генерирует промпт и запускает streaming генерацию
5. **Streaming**: AI генерирует JSON по частям, сервер парсит и отправляет обновления
6. **UI Updates**: Клиент получает частичные обновления и обновляет UI инкрементально
7. **Completion**: После завершения генерации клиент получает финальный документ

## Components and Interfaces

### 1. Client Components

#### VacancyChatInterface (React Component)

```typescript
interface VacancyChatInterfaceProps {
  workspaceId: string;
  initialDocument?: VacancyDocument;
  onSave?: (document: VacancyDocument) => Promise<void>;
}

interface VacancyDocument {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  customBotInstructions?: string;
  customScreeningPrompt?: string;
  customInterviewQuestions?: string;
  customOrganizationalQuestions?: string;
}
```

Компонент управляет:
- Состоянием документа (currentDocument)
- Историей диалога (conversationHistory)
- Статусом генерации (idle, loading, streaming, error)
- Отправкой сообщений через fetch API
- Обработкой streaming ответов

#### useVacancyChat (Custom Hook)

```typescript
interface UseVacancyChatOptions {
  workspaceId: string;
  initialDocument?: VacancyDocument;
  apiEndpoint?: string;
}

interface UseVacancyChatReturn {
  document: VacancyDocument;
  messages: ChatMessage[];
  status: ChatStatus;
  error: Error | null;
  sendMessage: (content: string) => Promise<void>;
  clearDocument: () => void;
}
```

Хук инкапсулирует логику:
- Управление состоянием документа
- Отправка сообщений
- Обработка streaming ответов
- Парсинг частичных JSON обновлений
- Обработка ошибок

### 2. Server Components

#### API Route Handler

**Endpoint**: `POST /api/vacancy/chat-generate`

**Request Schema**:
```typescript
{
  workspaceId: string;
  message: string; // max 5000 chars
  currentDocument?: VacancyDocument;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>; // max 10 messages
}
```

**Response**: Server-Sent Events (SSE) stream

```typescript
// Partial update (every 3 chunks)
data: {"document": {...}, "partial": true}

// Final update
data: {"document": {...}, "done": true}

// Error
data: {"document": {...}, "error": "...", "done": true}
```

#### Prompt Builder

```typescript
function buildVacancyGenerationPrompt(
  message: string,
  currentDocument?: VacancyDocument,
  conversationHistory?: ConversationMessage[],
  companySettings?: CompanySettings
): string
```

Генерирует промпт, который:
- Включает контекст компании (если есть)
- Включает историю диалога
- Включает текущее состояние документа
- Даёт инструкции по обновлению полей
- Требует JSON ответ

#### JSON Parser

```typescript
function parseVacancyJSON(
  text: string,
  fallback?: VacancyDocument
): {
  document: VacancyDocument;
  isComplete: boolean;
}
```

Парсер обрабатывает:
- Полный JSON (когда генерация завершена)
- Частичный JSON (во время streaming)
- Markdown обёртки (```json)
- Escape-последовательности
- Невалидный JSON (fallback на regex extraction)

```typescript
function extractPartialDocument(
  text: string,
  fallback?: VacancyDocument
): VacancyDocument
```

Извлекает поля из незавершённого JSON используя regex:
- Ищет паттерн `"field": "value"`
- Поддерживает многострочные значения
- Декодирует escape-последовательности
- Возвращает fallback значения для отсутствующих полей

### 3. Integration Components

#### Rate Limiter

```typescript
checkRateLimit(workspaceId: string, limit: number, window: number): {
  allowed: boolean;
  resetAt: number;
}
```

- Лимит: 10 запросов на workspace
- Окно: 60 секунд
- Возвращает 429 при превышении

#### Audit Logger

```typescript
auditLogger.logAccess({
  userId: string;
  action: "ACCESS";
  resourceType: "VACANCY";
  resourceId: string;
  metadata: {
    action: "vacancy_ai_generation_started";
    workspaceId: string;
    messageLength: number;
    hasConversationHistory: boolean;
  };
})
```

Логирует:
- Начало AI генерации
- Метаданные запроса
- Ошибки (если есть)

#### Langfuse Integration

```typescript
streamText({
  prompt: string;
  generationName: "vacancy-chat-generation";
  entityId: workspaceId;
  metadata: {
    workspaceId: string;
    userId: string;
  };
})
```

Автоматически логирует:
- Промпт
- Ответ AI
- Токены
- Latency
- Ошибки

## Data Models

### VacancyDocument

```typescript
interface VacancyDocument {
  // Основные поля
  title?: string; // max 500 chars
  description?: string; // max 50000 chars
  requirements?: string;
  responsibilities?: string;
  conditions?: string;
  
  // Настройки бота
  customBotInstructions?: string; // max 5000 chars
  customScreeningPrompt?: string; // max 5000 chars
  customInterviewQuestions?: string; // max 5000 chars
  customOrganizationalQuestions?: string; // max 5000 chars
}
```

### VacancyRequirements (Structured)

```typescript
interface VacancyRequirements {
  job_title: string;
  summary: string;
  mandatory_requirements: string[];
  nice_to_have_skills: string[];
  tech_stack: string[];
  experience_years: {
    min: number | null;
    description: string;
  };
  languages: Array<{
    language: string;
    level: string;
  }>;
  location_type: string;
  keywords_for_matching: string[];
}
```

Примечание: Извлечение структурированных requirements будет реализовано в отдельной задаче после создания вакансии.

### ConversationMessage

```typescript
interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}
```

### CompanySettings

```typescript
interface CompanySettings {
  name: string;
  description?: string;
  website?: string;
  botName?: string;
  botRole?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Processing Updates Document

*For any* valid user message and current document state, when the message is processed by AI, the returned document should contain updates relevant to the message content.

**Validates: Requirements 1.1**

### Property 2: Response Format Consistency

*For any* valid API request, the response should contain a document object with all expected fields (title, description, requirements, responsibilities, conditions).

**Validates: Requirements 1.2**

### Property 3: Quick Reply Sends Message

*For any* quick reply button, when clicked, it should trigger a message send with the button's text content.

**Validates: Requirements 1.3**

### Property 4: Conversation History Accumulation

*For any* sequence of messages, the conversation history should contain all messages up to the configured limit (10 messages), with older messages being removed when the limit is exceeded.

**Validates: Requirements 1.4, 9.1, 9.2, 9.3**

### Property 5: Company Settings Integration

*For any* workspace with company settings, the AI prompt should include the company name, description, botName, and botRole from those settings.

**Validates: Requirements 1.5, 7.1**

### Property 6: Document Field Updates Reflect in UI

*For any* document field (title, description, requirements, responsibilities, conditions, customBotInstructions), when AI updates that field, the UI should display the updated value.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 7: Field Preservation Invariant

*For any* document update, fields that are not explicitly updated by AI should retain their previous values.

**Validates: Requirements 2.5**

### Property 8: Requirements Extraction Completeness

*For any* description containing requirements information (skills, technologies, experience, languages), the AI should extract and populate the corresponding fields in the requirements structure.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 9: Requirements Format Validation

*For any* saved vacancy requirements, the data should conform to the VacancyRequirements schema with all required fields present and correctly typed.

**Validates: Requirements 4.5**

### Property 10: Bot Configuration Generation

*For any* user request to configure bot settings (instructions, screening, interview questions, organizational questions), the AI should generate content for the corresponding customBot field.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 11: Create Button Visibility

*For any* document state, the "Create Vacancy" button should be visible if and only if the title field is non-empty.

**Validates: Requirements 6.1**

### Property 12: Vacancy Persistence

*For any* valid vacancy document, when the create button is clicked, the vacancy should be saved to the database and retrievable by its ID.

**Validates: Requirements 6.2**

### Property 13: Post-Save Navigation

*For any* successfully saved vacancy, the user should be redirected to the vacancy detail page with the correct vacancy ID in the URL.

**Validates: Requirements 6.3**

### Property 14: Save Error Handling

*For any* failed vacancy save operation, an error message should be displayed to the user explaining the failure.

**Validates: Requirements 6.4**

### Property 15: Button Disabled During Save

*For any* save operation in progress, the "Create Vacancy" button should be disabled until the operation completes or fails.

**Validates: Requirements 6.5**

### Property 16: Bot Name Presentation

*For any* company settings with a botName defined, the AI's first message should include or reference that bot name.

**Validates: Requirements 7.2**

### Property 17: Parse Error Handling

*For any* AI response that cannot be parsed as valid JSON, the system should display a parse error message to the user.

**Validates: Requirements 8.1**

### Property 18: Network Error Recovery

*For any* network error during generation, the system should display an error message with an option to retry the request.

**Validates: Requirements 8.2**

### Property 19: Validation Error Display

*For any* validation failure (schema mismatch, field length exceeded), the system should display specific validation error messages.

**Validates: Requirements 8.3**

### Property 20: Error Logging

*For any* error during generation or save, the error should be logged to Langfuse with relevant context (workspaceId, userId, error message).

**Validates: Requirements 8.5, 10.3**

### Property 21: History Context Transmission

*For any* message sent with existing conversation history, the API request should include the history in the conversationHistory field.

**Validates: Requirements 9.4**

### Property 22: History State Persistence

*For any* conversation, the history should be maintained in the React component state and survive re-renders.

**Validates: Requirements 9.5**

### Property 23: Langfuse Trace Creation

*For any* AI generation request, a trace should be created in Langfuse with generationName "vacancy-chat-generation".

**Validates: Requirements 10.1, 10.5**

### Property 24: Langfuse Trace Completion

*For any* completed AI generation, the Langfuse trace should be updated with the full response text and token counts.

**Validates: Requirements 10.2**

### Property 25: Langfuse Metadata Inclusion

*For any* Langfuse trace, the metadata should include workspaceId and userId.

**Validates: Requirements 10.4**

### Property 26: Loading Indicator Display

*For any* generation in progress, a loading indicator should be visible in the UI.

**Validates: Requirements 11.1**

### Property 27: Input Clearing

*For any* successfully sent message, the input field should be cleared immediately after sending.

**Validates: Requirements 11.2**

### Property 28: Quick Reply Visual Feedback

*For any* quick reply button click, there should be visual feedback (e.g., button state change, ripple effect).

**Validates: Requirements 11.3**

### Property 29: Responsive Layout

*For any* viewport size (mobile, tablet, desktop), the chat interface should be usable and properly laid out.

**Validates: Requirements 11.5**

### Property 30: Unauthorized Access Rejection

*For any* request without a valid session, the API should return a 401 Unauthorized error.

**Validates: Requirements 12.1**

### Property 31: Forbidden Workspace Access

*For any* request where the user is not a member of the specified workspace, the API should return a 403 Forbidden error.

**Validates: Requirements 12.2**

### Property 32: Request Validation

*For any* API request, the workspaceId and userId should be validated before processing.

**Validates: Requirements 12.3, 12.4**

## Error Handling

### Client-Side Errors

1. **Network Errors**
   - Display: "Не удалось подключиться к серверу. Проверьте интернет-соединение."
   - Action: Retry button
   - Logging: Console error

2. **Parse Errors**
   - Display: "Не удалось обработать ответ. Попробуйте переформулировать запрос."
   - Action: Allow retry with same or different message
   - Logging: Console error + Sentry (if configured)

3. **Validation Errors**
   - Display: Specific field errors (e.g., "Название не может превышать 500 символов")
   - Action: Highlight invalid field
   - Logging: Console warning

4. **Timeout Errors**
   - Display: "Генерация занимает слишком много времени. Попробуйте упростить запрос."
   - Action: Retry button
   - Logging: Console error

### Server-Side Errors

1. **Authentication Errors (401)**
   - Response: `{ error: "Не авторизован" }`
   - Action: Redirect to login
   - Logging: Audit log

2. **Authorization Errors (403)**
   - Response: `{ error: "Нет доступа к workspace" }`
   - Action: Display error message
   - Logging: Audit log

3. **Validation Errors (400)**
   - Response: `{ error: "Ошибка валидации", details: {...} }`
   - Action: Display specific errors
   - Logging: Console warning

4. **Rate Limit Errors (429)**
   - Response: `{ error: "Превышен лимит запросов", retryAfter: 30 }`
   - Headers: `Retry-After`, `X-RateLimit-*`
   - Action: Display countdown timer
   - Logging: Audit log

5. **AI Generation Errors (500)**
   - Response: `{ error: "Не удалось сгенерировать вакансию" }`
   - Action: Offer retry
   - Logging: Langfuse + Sentry

6. **Database Errors (500)**
   - Response: `{ error: "Внутренняя ошибка сервера" }`
   - Action: Generic error message
   - Logging: Sentry + audit log

### Error Recovery Strategies

1. **Partial JSON Recovery**: Если AI генерация прерывается, система пытается извлечь частичные данные используя regex
2. **Fallback Values**: Если поле не может быть извлечено, используется предыдущее значение из currentDocument
3. **Graceful Degradation**: Если streaming не работает, можно добавить fallback на обычный режим (будущая задача)

## Testing Strategy

### Unit Tests

Unit tests будут проверять:
- Парсинг JSON (полный и частичный)
- Извлечение полей через regex
- Валидацию входных данных
- Построение промптов
- Обработку ошибок

Примеры:
```typescript
describe("parseVacancyJSON", () => {
  it("should parse complete JSON", () => {
    const input = '{"title": "Developer", "description": "..."}';
    const result = parseVacancyJSON(input);
    expect(result.isComplete).toBe(true);
    expect(result.document.title).toBe("Developer");
  });

  it("should extract partial data from incomplete JSON", () => {
    const input = '{"title": "Developer", "description": "Some text...';
    const result = parseVacancyJSON(input);
    expect(result.isComplete).toBe(false);
    expect(result.document.title).toBe("Developer");
  });
});
```

### Property-Based Tests

Property tests будут использовать **fast-check** (TypeScript/JavaScript property testing library) для генерации случайных входных данных и проверки универсальных свойств.

Конфигурация:
- Минимум 100 итераций на тест
- Каждый тест должен ссылаться на property из design document
- Формат тега: `// Feature: vacancy-ai-assistant, Property N: <property text>`

Примеры:
```typescript
import fc from "fast-check";

// Feature: vacancy-ai-assistant, Property 7: Field Preservation Invariant
describe("Property 7: Field Preservation", () => {
  it("should preserve fields not updated by AI", () => {
    fc.assert(
      fc.property(
        fc.record({
          title: fc.string(),
          description: fc.string(),
          requirements: fc.string(),
        }),
        fc.record({
          title: fc.string(),
        }),
        (currentDoc, update) => {
          const result = { ...currentDoc, ...update };
          expect(result.description).toBe(currentDoc.description);
          expect(result.requirements).toBe(currentDoc.requirements);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: vacancy-ai-assistant, Property 4: Conversation History Accumulation
describe("Property 4: History Management", () => {
  it("should maintain history up to limit", () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({
          role: fc.constantFrom("user", "assistant"),
          content: fc.string({ minLength: 1, maxLength: 100 })
        }), { minLength: 0, maxLength: 20 }),
        (messages) => {
          const history = messages.slice(-10);
          expect(history.length).toBeLessThanOrEqual(10);
          if (messages.length > 10) {
            expect(history).toEqual(messages.slice(-10));
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Integration tests будут проверять:
- End-to-end flow от клиента до сервера
- Интеграцию с базой данных
- Интеграцию с Langfuse
- Авторизацию и контроль доступа

Примеры:
```typescript
describe("Vacancy Chat API", () => {
  it("should create vacancy through chat", async () => {
    const response = await fetch("/api/vacancy/chat-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: "ws_test",
        message: "Нужен Senior TypeScript Developer",
      }),
    });

    expect(response.ok).toBe(true);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
  });

  it("should reject unauthorized requests", async () => {
    const response = await fetch("/api/vacancy/chat-generate", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "ws_test", message: "test" }),
    });

    expect(response.status).toBe(401);
  });
});
```

### E2E Tests

E2E tests будут использовать Playwright для проверки:
- Полного user flow создания вакансии
- Streaming обновлений в UI
- Обработки ошибок
- Responsive design

Примеры:
```typescript
test("should create vacancy through chat interface", async ({ page }) => {
  await page.goto("/workspace/ws_test/vacancies/new");
  
  await page.fill('[data-testid="chat-input"]', "Нужен Senior Developer");
  await page.click('[data-testid="send-button"]');
  
  await page.waitForSelector('[data-testid="document-title"]');
  const title = await page.textContent('[data-testid="document-title"]');
  expect(title).toContain("Senior Developer");
  
  await page.click('[data-testid="create-vacancy-button"]');
  await page.waitForURL(/\/vacancies\/[a-z0-9-]+$/);
});
```

## Performance Considerations

### Streaming Optimization

1. **Chunking Strategy**: Отправляем частичные обновления каждые 3 чанка от AI, чтобы балансировать между responsiveness и overhead
2. **Debouncing**: UI обновления debounced для предотвращения слишком частых re-renders
3. **Memoization**: Используем React.memo и useMemo для предотвращения ненужных re-renders

### Rate Limiting

- 10 запросов на workspace в минуту
- Предотвращает abuse и контролирует расходы на AI
- Клиент показывает countdown timer при достижении лимита

### Caching

- Company settings кешируются на уровне запроса
- Workspace access checks кешируются на уровне запроса
- Conversation history хранится в React state (не в БД)

### Token Optimization

- Conversation history ограничена 10 сообщениями
- Промпт оптимизирован для минимального размера
- Используем truncation для длинных сообщений (max 5000 chars)

## Security Considerations

### Input Sanitization

```typescript
const sanitizedMessage = truncateText(sanitizePromptText(message), 5000);
const sanitizedHistory = conversationHistory
  ?.slice(0, 10)
  .map(msg => sanitizeConversationMessage(msg));
```

- Удаляем потенциально опасные символы
- Ограничиваем длину входных данных
- Валидируем формат данных через Zod

### Authentication & Authorization

1. **Session Check**: Проверяем наличие валидной сессии через `getSession()`
2. **Workspace Access**: Проверяем membership пользователя в workspace
3. **Rate Limiting**: Предотвращаем abuse через rate limiter
4. **Audit Logging**: Логируем все попытки доступа

### Data Privacy

- Не логируем sensitive данные в Langfuse (только metadata)
- Используем placeholder UUID для audit logs (вместо prefixed IDs)
- Не храним conversation history в БД (только в client state)

### Error Messages

- Не раскрываем внутренние детали системы в error messages
- Используем generic messages для 500 errors
- Логируем детальные ошибки в Sentry/Langfuse для debugging

## Future Enhancements

1. **Structured Requirements Extraction**: Автоматическое извлечение VacancyRequirements из description после создания вакансии
2. **Quick Replies Generation**: AI генерирует умные quick replies на основе состояния документа
3. **Multi-language Support**: Поддержка создания вакансий на разных языках
4. **Template System**: Шаблоны вакансий для быстрого старта
5. **Collaborative Editing**: Несколько пользователей могут редактировать вакансию одновременно
6. **Version History**: История изменений документа вакансии
7. **AI Suggestions**: AI предлагает улучшения для существующих вакансий
8. **Fallback to Non-Streaming**: Если streaming не работает, fallback на обычный режим
