# Design Document: AI-ассистент рекрутера

## Overview

AI-ассистент рекрутера — это диалоговый агент, построенный на основе существующей мультиагентной архитектуры (packages/ai/src/agents). Агент использует паттерн Orchestrator-Worker для координации специализированных под-агентов: поиска кандидатов, аналитики вакансий, генерации контента и автоматизации коммуникаций.

Система интегрируется с существующими tRPC роутерами (vacancy, candidates) и расширяет их возможностями естественного языка. Рекрутер общается с агентом через чат-интерфейс, а агент выполняет многошаговые цепочки действий, объясняя свои решения.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        React Client                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Chat Interface │  │ Vacancy Context │  │ Candidate List  │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                    tRPC API Layer                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              recruiterAgent Router                       │    │
│  │  • chat (streaming)                                      │    │
│  │  • executeAction                                         │    │
│  │  • getRecommendations                                    │    │
│  │  • configureRules                                        │    │
│  └─────────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RecruiterAgentOrchestrator                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Intent Classifier                     │    │
│  │  • SEARCH_CANDIDATES                                     │    │
│  │  • ANALYZE_VACANCY                                       │    │
│  │  • GENERATE_CONTENT                                      │    │
│  │  • COMMUNICATE                                           │    │
│  │  • CONFIGURE_RULES                                       │    │
│  │  • GENERAL_QUESTION                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                             │                                    │
│         ┌───────────────────┼───────────────────┐               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Candidate  │    │  Vacancy    │    │  Content    │         │
│  │  Search     │    │  Analytics  │    │  Generator  │         │
│  │  Agent      │    │  Agent      │    │  Agent      │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │Communication│    │  Rule       │    │  Action     │         │
│  │  Agent      │    │  Engine     │    │  Executor   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │  Database   │  │  hh.ru API  │  │  Langfuse   │              │
│  │  (Drizzle)  │  │  (Market)   │  │  (Tracing)  │              │
│  └─────────────┘  └─────────────┘  └─────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input**: Рекрутер вводит запрос в чат ("Найди 5 кандидатов, готовых выйти за 2 недели")
2. **Intent Classification**: Orchestrator определяет намерение (SEARCH_CANDIDATES)
3. **Context Loading**: Загружается контекст (текущая вакансия, компания, история)
4. **Agent Execution**: Соответствующий агент выполняет задачу
5. **Action Chain**: Агент может вызывать другие агенты или сервисы
6. **Response Generation**: Формируется ответ с объяснением и рекомендациями
7. **Streaming**: Ответ стримится клиенту по частям

## Components and Interfaces

### 1. RecruiterAgentOrchestrator

Главный координатор, расширяющий существующий паттерн из `packages/ai/src/agents/orchestrator.ts`.

```typescript
interface RecruiterOrchestratorInput {
  message: string;
  workspaceId: string;
  vacancyId?: string;
  conversationHistory: ConversationMessage[];
}

interface RecruiterOrchestratorOutput {
  response: string;
  intent: RecruiterIntent;
  actions: ExecutedAction[];
  recommendations?: Recommendation[];
  candidates?: CandidateResult[];
  analytics?: VacancyAnalytics;
  agentTrace: AgentTraceEntry[];
}

type RecruiterIntent =
  | "SEARCH_CANDIDATES"
  | "ANALYZE_VACANCY"
  | "GENERATE_CONTENT"
  | "COMMUNICATE"
  | "CONFIGURE_RULES"
  | "GENERAL_QUESTION";
```

### 2. CandidateSearchAgent

Агент для поиска и анализа кандидатов.

```typescript
interface CandidateSearchInput {
  query: string;
  vacancyId: string;
  filters?: {
    availability?: string; // "2 weeks", "immediately"
    minFitScore?: number;
    experience?: string;
    skills?: string[];
  };
  limit?: number;
}

interface CandidateSearchOutput {
  candidates: Array<{
    id: string;
    name: string;
    fitScore: number;
    whySelected: string;
    availability: string;
    riskFactors: string[];
    recommendation: "invite" | "clarify" | "reject";
  }>;
  searchExplanation: string;
}
```

### 3. VacancyAnalyticsAgent

Агент для анализа эффективности вакансий.

```typescript
interface VacancyAnalyticsInput {
  vacancyId: string;
  question?: string; // "Почему мало откликов?"
}

interface VacancyAnalyticsOutput {
  analysis: {
    responseRate: number;
    marketComparison: {
      salaryVsMarket: number; // процент от рынка
      requirementsComplexity: "low" | "medium" | "high";
      competitorCount: number;
    };
    issues: Array<{
      type: "salary" | "requirements" | "description" | "timing";
      severity: "low" | "medium" | "high";
      description: string;
      recommendation: string;
    }>;
  };
  suggestions: string[];
}
```

### 4. ContentGeneratorAgent

Агент для генерации и оптимизации контента вакансий.

```typescript
interface ContentGeneratorInput {
  type: "vacancy" | "message" | "ab_variant";
  context: {
    vacancyId?: string;
    candidateId?: string;
    template?: string;
  };
  instructions?: string;
}

interface ContentGeneratorOutput {
  content: string;
  variants?: string[]; // для A/B тестирования
  seoKeywords?: string[];
  optimizationNotes?: string;
}
```

### 5. CommunicationAgent

Агент для автоматизации переписки с кандидатами.

```typescript
interface CommunicationInput {
  type: "greeting" | "clarification" | "invite" | "followup" | "rejection";
  candidateId: string;
  vacancyId: string;
  customInstructions?: string;
}

interface CommunicationOutput {
  message: string;
  personalizationDetails: {
    usedFromResume: string[];
    tone: string;
    nextSteps: string;
  };
  requiresApproval: boolean;
}
```

### 6. RuleEngine

Система правил для автономных решений.

```typescript
interface Rule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: RuleAction;
  priority: number;
  enabled: boolean;
}

interface RuleCondition {
  type: "fit_score" | "salary" | "experience" | "availability" | "custom";
  operator: "gt" | "lt" | "eq" | "contains";
  value: string | number;
}

interface RuleAction {
  type: "invite" | "clarify" | "reject" | "notify" | "pause_vacancy";
  params?: Record<string, unknown>;
}

interface RuleEngineConfig {
  autonomyLevel: "advise" | "confirm" | "autonomous";
  maxActionsPerHour: number;
  undoWindowMinutes: number;
}
```

### 7. ActionExecutor

Исполнитель действий с логированием и возможностью отмены.

```typescript
interface ExecutedAction {
  id: string;
  type: string;
  params: Record<string, unknown>;
  result: "success" | "failed" | "pending_approval";
  explanation: string;
  timestamp: Date;
  canUndo: boolean;
  undoDeadline?: Date;
}

interface ActionExecutorConfig {
  requireApproval: boolean;
  logToAudit: boolean;
  notifyOnComplete: boolean;
}
```

## Data Models

### ConversationContext

```typescript
interface ConversationContext {
  workspaceId: string;
  userId: string;
  currentVacancyId?: string;
  conversationHistory: ConversationMessage[];
  companySettings: CompanySettings;
  recentDecisions: Decision[];
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: RecruiterIntent;
    actions?: string[];
  };
}
```

### CandidateResult

```typescript
interface CandidateResult {
  id: string;
  name: string;
  fitScore: number;
  resumeScore: number;
  interviewScore?: number;
  availability: {
    status: "immediate" | "2_weeks" | "1_month" | "unknown";
    confirmedAt?: Date;
  };
  riskFactors: Array<{
    type: string;
    description: string;
    severity: "low" | "medium" | "high";
  }>;
  recommendation: {
    action: "invite" | "clarify" | "reject";
    reason: string;
    confidence: number;
  };
  contacts: {
    telegram?: string;
    phone?: string;
    email?: string;
  };
}
```

### VacancyAnalytics

```typescript
interface VacancyAnalytics {
  vacancyId: string;
  metrics: {
    totalResponses: number;
    processedResponses: number;
    highScoreResponses: number;
    avgScore: number;
    conversionRate: number;
  };
  marketComparison: {
    salaryPercentile: number;
    requirementsComplexity: number;
    competitorVacancies: number;
    avgMarketSalary: number;
  };
  issues: VacancyIssue[];
  recommendations: VacancyRecommendation[];
}

interface VacancyIssue {
  type: "salary" | "requirements" | "description" | "timing" | "competition";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  impact: string;
}

interface VacancyRecommendation {
  type: "change_title" | "adjust_salary" | "simplify_requirements" | "improve_description";
  title: string;
  description: string;
  expectedImpact: string;
  priority: number;
}
```

### AutomationRule

```typescript
interface AutomationRule {
  id: string;
  workspaceId: string;
  vacancyId?: string; // null = applies to all vacancies
  name: string;
  description: string;
  condition: {
    field: "fitScore" | "salaryExpectation" | "experience" | "availability";
    operator: ">" | "<" | "=" | "contains";
    value: string | number;
  };
  action: {
    type: "invite" | "clarify" | "reject" | "notify" | "tag";
    params: Record<string, unknown>;
    messageTemplate?: string;
  };
  autonomyLevel: "advise" | "confirm" | "autonomous";
  enabled: boolean;
  stats: {
    triggered: number;
    executed: number;
    undone: number;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### Feedback

```typescript
interface AgentFeedback {
  id: string;
  workspaceId: string;
  userId: string;
  actionId: string;
  feedbackType: "accepted" | "rejected" | "modified";
  originalRecommendation: string;
  userAction?: string;
  reason?: string;
  createdAt: Date;
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Intent Classification Accuracy

*For any* user message with a clear intent (search, analyze, generate, communicate, configure), the AI_Agent should classify the intent correctly and route to the appropriate sub-agent.

**Validates: Requirements 1.1**

### Property 2: Context Inclusion in Responses

*For any* request with a non-empty ConversationContext (workspaceId, vacancyId, companySettings), the agent's response should reference or utilize information from that context.

**Validates: Requirements 1.2, 7.1, 7.2, 7.3**

### Property 3: Action Chain Streaming

*For any* multi-step action chain, the streaming response should contain intermediate updates before the final result.

**Validates: Requirements 1.3**

### Property 4: Explanation Presence

*For any* action executed by the AI_Agent (search, recommendation, decision), the response should contain a non-empty explanation field describing the reasoning.

**Validates: Requirements 1.4, 6.3**

### Property 5: Conversation History Accumulation

*For any* sequence of messages in a session, the conversation history should contain all messages up to the configured limit, with older messages being removed when the limit is exceeded.

**Validates: Requirements 1.5**

### Property 6: Candidate Search Result Completeness

*For any* candidate search result, each candidate should contain: id, name, fitScore (0-100), whySelected (non-empty), availability, riskFactors (array), and recommendation (invite|clarify|reject).

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

### Property 7: Fit Score Range Invariant

*For any* calculated fitScore, the value should be within the range [0, 100].

**Validates: Requirements 2.5**

### Property 8: Vacancy Analytics Completeness

*For any* vacancy analysis, the result should contain: metrics (responseRate, avgScore), marketComparison (salaryPercentile, competitorVacancies), and at least one issue or recommendation if responseRate is below threshold.

**Validates: Requirements 3.2, 3.5**

### Property 9: Issue-Recommendation Pairing

*For any* identified vacancy issue, there should be a corresponding recommendation with a non-empty description and expectedImpact.

**Validates: Requirements 3.3, 3.4**

### Property 10: Content Generation Completeness

*For any* vacancy content generation request, the result should contain: title, description, requirements, and seoKeywords.

**Validates: Requirements 4.1, 4.2**

### Property 11: A/B Variants Generation

*For any* vacancy creation with A/B testing enabled, the result should contain at least 2 title variants.

**Validates: Requirements 4.3**

### Property 12: Message Personalization

*For any* candidate message, the personalizationDetails should contain usedFromResume (non-empty array) indicating which resume fields were used for personalization.

**Validates: Requirements 5.1, 5.2**

### Property 13: Message Type Coverage

*For any* automated message, the type should be one of: greeting, clarification, invite, followup, rejection.

**Validates: Requirements 5.3**

### Property 14: Message Logging

*For any* message sent to a candidate, there should be a corresponding log entry with timestamp, messageId, and candidateId.

**Validates: Requirements 5.5, 9.3**

### Property 15: Rule Application Consistency

*For any* candidate matching a rule's condition, the rule's action should be triggered (or queued for approval based on autonomyLevel).

**Validates: Requirements 6.1, 6.2**

### Property 16: Autonomy Level Enforcement

*For any* autonomous action with autonomyLevel="confirm", the action should have result="pending_approval" until explicitly approved.

**Validates: Requirements 6.4**

### Property 17: Company Settings Adaptation

*For any* workspace with botName and botRole configured, the agent's responses should use these values in the communication style.

**Validates: Requirements 7.5**

### Property 18: Authorization Check

*For any* action request, if the user lacks permission for the workspace, the system should return a 403 error.

**Validates: Requirements 9.1**

### Property 19: Action Undo Window

*For any* action with canUndo=true, the action should be reversible until undoDeadline is reached.

**Validates: Requirements 9.4**

### Property 20: Rate Limiting

*For any* sequence of automated actions exceeding maxActionsPerHour, subsequent actions should be rejected with a rate limit error.

**Validates: Requirements 9.5**

### Property 21: Feedback Persistence

*For any* feedback submission (accepted, rejected, modified), the feedback should be persisted and retrievable.

**Validates: Requirements 10.1**

### Property 22: Feedback Influence

*For any* recruiter with historical feedback, subsequent recommendations should have different confidence scores compared to a recruiter without feedback history.

**Validates: Requirements 10.2**

### Property 23: Quality Metrics Calculation

*For any* workspace with feedback history, the system should calculate and return acceptance rate and rejection rate metrics.

**Validates: Requirements 10.4**

## Error Handling

### Client-Side Errors

1. **Network Errors**
   - Display: "Не удалось подключиться к серверу. Проверьте интернет-соединение."
   - Action: Retry button with exponential backoff
   - Logging: Console error

2. **Intent Classification Errors**
   - Display: "Не удалось понять запрос. Попробуйте переформулировать."
   - Action: Show examples of valid queries
   - Logging: Langfuse trace

3. **Timeout Errors**
   - Display: "Запрос занимает слишком много времени. Попробуйте упростить запрос."
   - Action: Cancel and retry
   - Logging: Console error + Langfuse

### Server-Side Errors

1. **Authentication Errors (401)**
   - Response: `{ error: "Не авторизован" }`
   - Action: Redirect to login

2. **Authorization Errors (403)**
   - Response: `{ error: "Нет доступа к workspace" }`
   - Action: Display error message

3. **Rate Limit Errors (429)**
   - Response: `{ error: "Превышен лимит запросов", retryAfter: 60 }`
   - Action: Display countdown timer

4. **AI Generation Errors (500)**
   - Response: `{ error: "Не удалось обработать запрос" }`
   - Action: Offer retry with simplified query
   - Logging: Langfuse + Sentry

### Agent-Specific Errors

1. **No Candidates Found**
   - Response: Explain why no candidates match, suggest relaxing criteria
   - Action: Offer to modify search parameters

2. **Insufficient Data for Analysis**
   - Response: Explain what data is missing
   - Action: Suggest waiting for more responses or adding data

3. **Rule Conflict**
   - Response: Explain conflicting rules
   - Action: Suggest rule priority adjustment

## Testing Strategy

### Unit Tests

Unit tests будут проверять:
- Intent classification logic
- Rule condition evaluation
- Fit score calculation
- Message personalization logic
- Context building

### Property-Based Tests

Property tests будут использовать **fast-check** для генерации случайных входных данных.

Конфигурация:
- Минимум 100 итераций на тест
- Каждый тест должен ссылаться на property из design document
- Формат тега: `// Feature: recruiter-ai-agent, Property N: <property text>`

Примеры:
```typescript
import fc from "fast-check";

// Feature: recruiter-ai-agent, Property 7: Fit Score Range Invariant
describe("Property 7: Fit Score Range", () => {
  it("should always return fitScore between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.record({
          resumeScore: fc.integer({ min: 0, max: 100 }),
          interviewScore: fc.integer({ min: 0, max: 100 }),
          skillMatch: fc.float({ min: 0, max: 1 }),
        }),
        (input) => {
          const fitScore = calculateFitScore(input);
          return fitScore >= 0 && fitScore <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: recruiter-ai-agent, Property 16: Autonomy Level Enforcement
describe("Property 16: Autonomy Level", () => {
  it("should require approval when autonomyLevel is confirm", () => {
    fc.assert(
      fc.property(
        fc.record({
          autonomyLevel: fc.constant("confirm"),
          action: fc.constantFrom("invite", "reject", "clarify"),
          candidateId: fc.uuid(),
        }),
        async (input) => {
          const result = await executeAction(input);
          return result.result === "pending_approval";
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Integration tests будут проверять:
- End-to-end flow от запроса до ответа
- Интеграцию с базой данных
- Интеграцию с Langfuse
- Авторизацию и контроль доступа
- Rule Engine execution

### E2E Tests

E2E tests будут использовать Playwright для проверки:
- Полного user flow диалога с агентом
- Streaming обновлений в UI
- Обработки ошибок
- Responsive design

## Performance Considerations

### Streaming Optimization

1. **Chunking Strategy**: Отправляем частичные обновления каждые 3 чанка
2. **Debouncing**: UI обновления debounced для предотвращения частых re-renders
3. **Memoization**: React.memo и useMemo для предотвращения ненужных re-renders

### Caching Strategy

1. **Company Settings**: Кешируются на уровне запроса
2. **Vacancy Data**: Кешируются на 5 минут
3. **Market Analytics**: Кешируются на 1 час
4. **Candidate List**: Invalidate при изменениях

### Rate Limiting

- 30 запросов на workspace в минуту для chat
- 100 автоматических действий на workspace в час
- Exponential backoff при превышении

### Token Optimization

- Conversation history ограничена 20 сообщениями
- Промпты оптимизированы для минимального размера
- Используем truncation для длинных текстов

## Security Considerations

### Input Sanitization

```typescript
const sanitizedMessage = truncateText(sanitizePromptText(message), 5000);
```

- Удаляем потенциально опасные символы
- Ограничиваем длину входных данных
- Валидируем формат через Zod v4

### Authentication & Authorization

1. **Session Check**: Проверяем наличие валидной сессии
2. **Workspace Access**: Проверяем membership пользователя
3. **Action Permissions**: Проверяем права на конкретные действия
4. **Rate Limiting**: Предотвращаем abuse

### Audit Logging

Все автономные действия логируются:
- userId, workspaceId, actionType
- Input parameters
- Result and explanation
- Timestamp

### Data Privacy

- Не логируем sensitive данные в Langfuse
- Используем placeholder UUID для audit logs
- Не храним conversation history в БД (только в client state)

## Future Enhancements

1. **Voice Interface**: Голосовое управление агентом
2. **Multi-language Support**: Поддержка разных языков
3. **Advanced Analytics**: ML-based predictions
4. **Integration with External ATS**: Интеграция с внешними системами
5. **Collaborative Mode**: Несколько рекрутеров работают с одним агентом
6. **Custom Agent Training**: Обучение агента на данных компании
