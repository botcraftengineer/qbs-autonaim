# Design Document: Message Buffering with Debounce

## Overview

Система буферизации сообщений с debounce-механизмом для интервью-бота. Решает проблему множественных запросов в LLM при получении нескольких сообщений от кандидата в рамках одного ответа.

**Ключевые принципы:**

- Буферизация всех входящих сообщений кандидата
- Debounce через Inngest (без in-memory таймеров)
- Один запрос в LLM после завершения ответа
- Учет Telegram typing/voice событий
- Идемпотентность операций

## Architecture

### High-Level Flow

```
Telegram Message → Buffer Event → Inngest Debounce → Flush → LLM → Response
                      ↓
                   KV Storage
```

### Components

1. **Message Buffer Service** - управление буфером сообщений
2. **Inngest Event Handlers** - обработка событий и debounce
3. **Flush Orchestrator** - координация отправки в LLM
4. **Typing Event Handler** - обработка typing/voice событий

## Components and Interfaces

### 1. Message Buffer Service

**Ответственность:** Управление буфером сообщений в KV хранилище

```typescript
interface MessageBufferService {
  /**
   * Добавить сообщение в буфер
   */
  addMessage(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void>;

  /**
   * Получить все сообщения из буфера
   */
  getMessages(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<BufferedMessage[]>;

  /**
   * Очистить буфер
   */
  clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void>;

  /**
   * Проверить существование буфера
   */
  hasBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<boolean>;
}
```

### 2. Inngest Events Schema

**Новые события:**

```typescript
// Событие добавления сообщения в буфер
interface MessageBufferedEvent {
  name: "interview/message.buffered";
  data: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    messageId: string;
    timestamp: number;
  };
}

// Событие typing/recording
interface TypingActivityEvent {
  name: "interview/typing.activity";
  data: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    activityType: "typing" | "recording";
    timestamp: number;
  };
}

// Событие flush буфера
interface BufferFlushEvent {
  name: "interview/buffer.flush";
  data: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    flushId: string; // для идемпотентности
    messageCount: number;
  };
}
```

### 3. Inngest Functions

#### 3.1 Buffer Debounce Function

```typescript
/**
 * Функция debounce для буфера сообщений
 * Запускается при каждом новом сообщении
 * Ждет N секунд без активности перед flush
 */
const bufferDebounceFunction = inngest.createFunction(
  {
    id: "interview-buffer-debounce",
    debounce: {
      key: "event.data.userId + event.data.conversationId + event.data.interviewStep",
      period: "10s", // конфигурируемый параметр
    },
  },
  { event: "interview/message.buffered" },
  async ({ event, step }) => {
    // Проверка существования буфера
    const hasBuffer = await step.run("check-buffer", async () => {
      return await messageBufferService.hasBuffer({
        userId: event.data.userId,
        conversationId: event.data.conversationId,
        interviewStep: event.data.interviewStep,
      });
    });

    if (!hasBuffer) {
      return { skipped: true, reason: "Buffer already flushed" };
    }

    // Отправка события flush
    await step.run("trigger-flush", async () => {
      await inngest.send({
        name: "interview/buffer.flush",
        data: {
          userId: event.data.userId,
          conversationId: event.data.conversationId,
          interviewStep: event.data.interviewStep,
          flushId: generateFlushId(event.data),
          messageCount: 0, // будет заполнено в flush функции
        },
      });
    });

    return { success: true };
  }
);
```

#### 3.2 Typing Activity Handler

```typescript
/**
 * Обработчик typing/recording событий
 * Продлевает debounce без flush
 */
const typingActivityFunction = inngest.createFunction(
  {
    id: "interview-typing-activity",
    debounce: {
      key: "event.data.userId + event.data.conversationId + event.data.interviewStep",
      period: "5s", // меньше чем основной debounce
    },
  },
  { event: "interview/typing.activity" },
  async ({ event, step }) => {
    // Просто продлеваем ожидание
    // Реальный flush произойдет через message.buffered event
    return { 
      activity: event.data.activityType,
      timestamp: event.data.timestamp 
    };
  }
);
```

#### 3.3 Buffer Flush Function

```typescript
/**
 * Функция flush буфера
 * Отправляет агрегированные сообщения в LLM
 * Идемпотентная операция
 */
const bufferFlushFunction = inngest.createFunction(
  {
    id: "interview-buffer-flush",
    idempotency: "event.data.flushId",
  },
  { event: "interview/buffer.flush" },
  async ({ event, step }) => {
    // Получение сообщений из буфера
    const messages = await step.run("get-buffered-messages", async () => {
      return await messageBufferService.getMessages({
        userId: event.data.userId,
        conversationId: event.data.conversationId,
        interviewStep: event.data.interviewStep,
      });
    });

    if (messages.length === 0) {
      return { skipped: true, reason: "Buffer is empty" };
    }

    // Агрегация сообщений
    const aggregatedContent = await step.run("aggregate-messages", async () => {
      return messages
        .map(m => m.content)
        .join("\n\n");
    });

    // Отправка в LLM
    const llmResponse = await step.run("send-to-llm", async () => {
      return await analyzeAndGenerateNextQuestion({
        conversationId: event.data.conversationId,
        questionNumber: event.data.interviewStep,
        currentTranscription: aggregatedContent,
        currentQuestion: messages[0].questionContext || "",
      });
    });

    // Отправка ответа кандидату
    await step.run("send-response", async () => {
      await inngest.send({
        name: "telegram/message.send",
        data: {
          conversationId: event.data.conversationId,
          content: llmResponse.nextQuestion,
          messageId: generateMessageId(),
        },
      });
    });

    // Очистка буфера
    await step.run("clear-buffer", async () => {
      await messageBufferService.clearBuffer({
        userId: event.data.userId,
        conversationId: event.data.conversationId,
        interviewStep: event.data.interviewStep,
      });
    });

    return {
      success: true,
      messageCount: messages.length,
      flushId: event.data.flushId,
    };
  }
);
```

### 4. Message Buffer Implementation

**PostgreSQL Metadata Schema:**

Используем существующее поле `metadata` в таблице `conversations` для хранения буфера.

```typescript
// Расширение существующего ConversationMetadata
interface ConversationMetadata {
  // ... существующие поля
  messageBuffer?: MessageBuffer;
}

interface MessageBuffer {
  [interviewStep: number]: BufferValue;
}

interface BufferValue {
  messages: BufferedMessage[];
  createdAt: number;
  lastUpdatedAt: number;
  flushId?: string; // для предотвращения дублирования
}

interface BufferedMessage {
  id: string;
  content: string;
  contentType: "TEXT" | "VOICE";
  timestamp: number;
  questionContext?: string; // текущий вопрос
}
```

**Implementation:**

```typescript
class PostgresMessageBufferService implements MessageBufferService {
  async addMessage(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void> {
    const metadata = await getConversationMetadata(params.conversationId);
    
    // Инициализация буфера если не существует
    if (!metadata.messageBuffer) {
      metadata.messageBuffer = {};
    }
    
    if (!metadata.messageBuffer[params.interviewStep]) {
      metadata.messageBuffer[params.interviewStep] = {
        messages: [],
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
      };
    }
    
    // Валидация пустых сообщений
    if (!params.message.content.trim()) {
      return;
    }
    
    // Добавление сообщения
    metadata.messageBuffer[params.interviewStep].messages.push(params.message);
    metadata.messageBuffer[params.interviewStep].lastUpdatedAt = Date.now();
    
    await updateConversationMetadata(params.conversationId, metadata);
  }

  async getMessages(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<BufferedMessage[]> {
    const metadata = await getConversationMetadata(params.conversationId);
    return metadata.messageBuffer?.[params.interviewStep]?.messages || [];
  }

  async clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void> {
    const metadata = await getConversationMetadata(params.conversationId);
    
    if (metadata.messageBuffer?.[params.interviewStep]) {
      delete metadata.messageBuffer[params.interviewStep];
      await updateConversationMetadata(params.conversationId, metadata);
    }
  }

  async hasBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<boolean> {
    const metadata = await getConversationMetadata(params.conversationId);
    return !!metadata.messageBuffer?.[params.interviewStep];
  }
}
```

### 5. Integration with Telegram Handler

**Модификация обработчика сообщений:**

```typescript
// В packages/tg-client/src/handlers/message-handler.ts

async function handleIncomingMessage(
  message: TelegramMessage,
  conversationId: string,
  userId: string
) {
  // Определение текущего шага интервью
  const interviewStep = await getQuestionCount(conversationId);

  // Добавление в буфер
  await messageBufferService.addMessage({
    userId,
    conversationId,
    interviewStep,
    message: {
      id: message.id,
      content: message.text || message.transcription,
      contentType: message.voice ? "VOICE" : "TEXT",
      timestamp: Date.now(),
      questionContext: await getLastQuestionAsked(conversationId),
    },
  });

  // Отправка события в Inngest
  await inngest.send({
    name: "interview/message.buffered",
    data: {
      userId,
      conversationId,
      interviewStep,
      messageId: message.id,
      timestamp: Date.now(),
    },
  });
}
```

**Обработка typing событий:**

```typescript
// В packages/tg-client/src/handlers/typing-handler.ts

async function handleTypingEvent(
  userId: string,
  conversationId: string,
  activityType: "typing" | "recording"
) {
  const interviewStep = await getQuestionCount(conversationId);

  // Отправка события typing activity
  await inngest.send({
    name: "interview/typing.activity",
    data: {
      userId,
      conversationId,
      interviewStep,
      activityType,
      timestamp: Date.now(),
    },
  });
}
```

## Data Models

### Buffer Storage Model

```typescript
// PostgreSQL metadata field extension
interface ConversationMetadata {
  // Существующие поля
  identifiedBy?: "pin_code" | "vacancy_search" | "username" | "none";
  pinCode?: string;
  searchQuery?: string;
  awaitingPin?: boolean;
  interviewStarted?: boolean;
  questionAnswers?: QuestionAnswer[];
  lastQuestionAsked?: string;
  interviewCompleted?: boolean;
  completedAt?: string;
  
  // Новое поле для буферизации
  messageBuffer?: MessageBuffer;
}

interface MessageBuffer {
  [interviewStep: number]: BufferValue;
}

interface BufferValue {
  messages: BufferedMessage[];
  createdAt: number;
  lastUpdatedAt: number;
  flushId?: string;
}

interface BufferedMessage {
  id: string;
  content: string;
  contentType: "TEXT" | "VOICE";
  timestamp: number;
  questionContext?: string;
}
```

### Flush Tracking Model

```typescript
// Для мониторинга и отладки (опционально, можно логировать)
interface FlushLog {
  flushId: string;
  userId: string;
  conversationId: string;
  interviewStep: number;
  messageCount: number;
  startedAt: number;
  completedAt?: number;
  status: "pending" | "success" | "failed";
  error?: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Message Ordering Preservation

*For any* sequence of messages from a candidate, the order of messages in the buffer SHALL match the order they were received.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: Debounce Timer Reset

*For any* new message event, the debounce timer SHALL be reset, preventing premature flush.

**Validates: Requirements 2.2, 2.3**

### Property 3: Typing Event Non-Flush

*For any* typing or recording event, the system SHALL NOT trigger a flush operation.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Single LLM Request Per Answer

*For any* complete answer from a candidate (after debounce timeout), exactly one request SHALL be sent to the LLM.

**Validates: Requirements 4.2, 4.3**

### Property 5: Buffer Cleanup After Successful Flush

*For any* successful flush operation, the buffer SHALL be cleared only after the LLM response is successfully delivered.

**Validates: Requirements 4.4, 5.3**

### Property 6: Idempotent Flush Operations

*For any* flush operation with the same flushId, executing it multiple times SHALL produce the same result without duplicate LLM requests.

**Validates: Requirements 5.1, 5.2**

### Property 7: Buffer Isolation

*For any* two different interview steps or conversations, their buffers SHALL be completely isolated and not interfere with each other.

**Validates: Requirements 1.4, 1.5**

### Property 8: Empty Message Rejection

*For any* empty or whitespace-only message, the system SHALL NOT add it to the buffer.

**Validates: Requirements 8.1**

### Property 9: Concurrent Message Handling

*For any* message received during an active flush operation, it SHALL be added to a new buffer for the next interview step.

**Validates: Requirements 8.2**

### Property 10: Buffer TTL Enforcement

*For any* buffer that exceeds the maximum TTL (1 hour), the system SHALL automatically expire it from storage.

**Validates: Requirements 8.5**

## Error Handling

### 1. KV Storage Failures

**Scenario:** KV storage недоступен или возвращает ошибку

**Strategy:**

- Логирование ошибки с полным контекстом
- Fallback: сохранение в PostgreSQL metadata поле conversation
- Уведомление администратора через мониторинг
- Retry с exponential backoff (3 попытки)

### 2. Inngest Unavailability

**Scenario:** Inngest API недоступен

**Strategy:**

- Логирование критической ошибки
- Fallback: прямой вызов LLM без буферизации (деградация функциональности)
- Алерт администратору
- Сохранение события в dead letter queue для повторной обработки

### 3. LLM API Failures

**Scenario:** ai-sdk возвращает ошибку или timeout

**Strategy:**

- Сохранение буфера (не очищать)
- Retry с exponential backoff (до 3 попыток)
- Отправка сообщения кандидату о временной проблеме
- Логирование для анализа

### 4. Buffer Overflow

**Scenario:** Буфер превышает максимальный размер (например, 50 сообщений)

**Strategy:**

- Принудительный flush независимо от debounce
- Логирование аномалии
- Мониторинг для выявления паттернов

### 5. Duplicate Flush Attempts

**Scenario:** Попытка flush уже обработанного буфера

**Strategy:**

- Проверка flushId перед обработкой
- Возврат cached результата если доступен
- Логирование для отладки

## Testing Strategy

### Unit Tests

**Message Buffer Service:**

- Добавление сообщения в пустой буфер
- Добавление нескольких сообщений
- Получение сообщений из буфера
- Очистка буфера
- Проверка существования буфера
- Обработка пустых сообщений

**Flush ID Generation:**

- Уникальность ID для разных параметров
- Идемпотентность для одинаковых параметров

**Key Generation:**

- Корректность формата ключа
- Изоляция между разными userId/conversationId/interviewStep

### Property-Based Tests

Используем **fast-check** для TypeScript. Минимум 100 итераций на тест.

**Property Test 1: Message Ordering**

```typescript
// Feature: message-buffering-debounce, Property 1: Message Ordering Preservation
fc.assert(
  fc.asyncProperty(
    fc.array(fc.record({
      id: fc.uuid(),
      content: fc.string({ minLength: 1 }),
      contentType: fc.constantFrom("TEXT", "VOICE"),
      timestamp: fc.integer({ min: 0 }),
    })),
    async (messages) => {
      const buffer = new KVMessageBufferService(mockKV);
      const params = {
        userId: "test-user",
        conversationId: "test-conv",
        interviewStep: 1,
      };

      for (const msg of messages) {
        await buffer.addMessage({ ...params, message: msg });
      }

      const retrieved = await buffer.getMessages(params);
      
      // Проверка порядка
      for (let i = 0; i < messages.length; i++) {
        expect(retrieved[i].id).toBe(messages[i].id);
      }
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 2: Buffer Isolation**

```typescript
// Feature: message-buffering-debounce, Property 7: Buffer Isolation
fc.assert(
  fc.asyncProperty(
    fc.tuple(
      fc.record({
        userId: fc.uuid(),
        conversationId: fc.uuid(),
        interviewStep: fc.integer({ min: 1, max: 10 }),
      }),
      fc.record({
        userId: fc.uuid(),
        conversationId: fc.uuid(),
        interviewStep: fc.integer({ min: 1, max: 10 }),
      }),
      fc.array(fc.string({ minLength: 1 }))
    ),
    async ([params1, params2, messages]) => {
      const buffer = new KVMessageBufferService(mockKV);

      // Добавляем сообщения в первый буфер
      for (const content of messages) {
        await buffer.addMessage({
          ...params1,
          message: {
            id: generateId(),
            content,
            contentType: "TEXT",
            timestamp: Date.now(),
          },
        });
      }

      // Проверяем что второй буфер пустой
      const buffer2Messages = await buffer.getMessages(params2);
      expect(buffer2Messages).toHaveLength(0);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 3: Idempotent Flush**

```typescript
// Feature: message-buffering-debounce, Property 6: Idempotent Flush Operations
fc.assert(
  fc.asyncProperty(
    fc.record({
      userId: fc.uuid(),
      conversationId: fc.uuid(),
      interviewStep: fc.integer({ min: 1, max: 10 }),
      flushId: fc.uuid(),
    }),
    fc.integer({ min: 2, max: 5 }), // количество повторных вызовов
    async (flushParams, repeatCount) => {
      const results = [];
      
      for (let i = 0; i < repeatCount; i++) {
        const result = await bufferFlushFunction.handler({
          event: {
            name: "interview/buffer.flush",
            data: flushParams,
          },
        });
        results.push(result);
      }

      // Все результаты должны быть идентичны
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }

      // LLM должен быть вызван только один раз
      expect(mockLLM.callCount).toBe(1);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 4: Empty Message Rejection**

```typescript
// Feature: message-buffering-debounce, Property 8: Empty Message Rejection
fc.assert(
  fc.asyncProperty(
    fc.array(fc.constantFrom("", "   ", "\t", "\n", "  \n  ")),
    async (emptyMessages) => {
      const buffer = new KVMessageBufferService(mockKV);
      const params = {
        userId: "test-user",
        conversationId: "test-conv",
        interviewStep: 1,
      };

      for (const content of emptyMessages) {
        await buffer.addMessage({
          ...params,
          message: {
            id: generateId(),
            content,
            contentType: "TEXT",
            timestamp: Date.now(),
          },
        });
      }

      const retrieved = await buffer.getMessages(params);
      expect(retrieved).toHaveLength(0);
    }
  ),
  { numRuns: 100 }
);
```

### Integration Tests

**Inngest Function Tests:**

- Debounce behavior с реальными событиями
- Typing activity продлевает ожидание
- Flush после timeout
- Идемпотентность flush операций

**End-to-End Flow:**

- Полный цикл: сообщение → буфер → debounce → flush → LLM → ответ
- Множественные сообщения агрегируются корректно
- Typing события не вызывают преждевременный flush

### Performance Tests

- Нагрузочное тестирование: 100+ сообщений в секунду
- Latency измерения для flush операций
- KV storage throughput тесты

## Configuration

### Environment Variables

```bash
# Debounce timeout (секунды)
INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT=10

# Typing activity timeout (секунды)
INTERVIEW_TYPING_DEBOUNCE_TIMEOUT=5

# Максимальный размер буфера (количество сообщений)
INTERVIEW_BUFFER_MAX_SIZE=50

# Включить/выключить буферизацию
INTERVIEW_BUFFER_ENABLED=true
```

### Monitoring Metrics

```typescript
interface BufferMetrics {
  // Количество активных буферов
  activeBuffers: number;
  
  // Средний размер буфера
  averageBufferSize: number;
  
  // Количество flush операций
  flushCount: number;
  
  // Успешность flush операций
  flushSuccessRate: number;
  
  // Среднее время ожидания до flush
  averageWaitTime: number;
  
  // Количество typing событий
  typingEventsCount: number;
  
  // Количество ошибок
  errorCount: number;
}
```

## Migration Strategy

### Phase 1: Infrastructure Setup

1. Создание KV namespace для буферов
2. Добавление новых Inngest событий в схему
3. Реализация MessageBufferService

### Phase 2: Inngest Functions

1. Реализация bufferDebounceFunction
2. Реализация typingActivityFunction
3. Реализация bufferFlushFunction
4. Тестирование в изоляции

### Phase 3: Integration

1. Модификация Telegram message handler
2. Добавление typing event handler
3. Feature flag для постепенного rollout

### Phase 4: Monitoring & Optimization

1. Настройка метрик и алертов
2. Анализ производительности
3. Оптимизация debounce timeout на основе данных

## Rollback Plan

**Feature Flag:**

```typescript
if (env.INTERVIEW_BUFFER_ENABLED === "false") {
  // Старая логика: прямой вызов LLM
  await analyzeAndGenerateNextQuestion(...);
} else {
  // Новая логика: буферизация
  await messageBufferService.addMessage(...);
}
```

**Rollback Steps:**

1. Установить `INTERVIEW_BUFFER_ENABLED=false`
2. Очистить все активные буферы из KV
3. Мониторинг восстановления нормальной работы
4. Анализ логов для выявления причин

## Future Enhancements

1. **Adaptive Debounce:** Динамическая настройка timeout на основе паттернов пользователя
2. **Smart Aggregation:** Семантическая группировка сообщений
3. **Partial Flush:** Отправка промежуточных ответов для длинных ответов
4. **Buffer Analytics:** Детальная аналитика паттернов ответов кандидатов
