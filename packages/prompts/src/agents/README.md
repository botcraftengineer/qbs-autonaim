# V2 Agents (AI SDK 6)

Новое поколение агентов на базе AI SDK 6 `ToolLoopAgent`.

## Основные улучшения

✅ **Автоматический парсинг** - Zod схемы валидируются автоматически  
✅ **Structured Output** - Типизированные ответы из коробки  
✅ **Tools Support** - Возможность добавлять инструменты для агентов  
✅ **Loop Control** - Встроенное управление multi-step выполнением  
✅ **Меньше кода** - Убрали весь ручной парсинг JSON  

## Доступные агенты

### InterviewerAgentV2
Проводит интервью с кандидатом.

```typescript
import { InterviewerAgentV2 } from "@qbs-autonaim/prompts";

const agent = new InterviewerAgentV2({ model: getAIModel() });

const result = await agent.execute({
  currentAnswer: "У меня 5 лет опыта в React",
  currentQuestion: "Расскажите о вашем опыте",
  previousQA: [],
  questionNumber: 1,
}, context);
```

### EscalationDetectorAgentV2
Определяет необходимость эскалации к человеку.

```typescript
import { EscalationDetectorAgentV2 } from "@qbs-autonaim/prompts";

const agent = new EscalationDetectorAgentV2({ model: getAIModel() });

const result = await agent.execute({
  message: "Хочу поговорить с живым человеком",
  conversationLength: 5,
}, context);
```

### InterviewCompletionAgentV2
Генерирует финальное сообщение после интервью.

```typescript
import { InterviewCompletionAgentV2 } from "@qbs-autonaim/prompts";

const agent = new InterviewCompletionAgentV2({ model: getAIModel() });

const result = await agent.execute({
  questionCount: 5,
  score: 4,
}, context);
```

### InterviewOrchestratorV2
Координирует работу всех агентов.

```typescript
import { InterviewOrchestratorV2 } from "@qbs-autonaim/prompts";

const orchestrator = new InterviewOrchestratorV2({
  model: getAIModel(),
  maxSteps: 10,
});

const result = await orchestrator.execute(input, context);
```

## Конфигурация

```typescript
interface ToolLoopAgentConfig {
  model: LanguageModel;        // AI модель
  maxTokens?: number;           // Не используется в ToolLoopAgent
  maxSteps?: number;            // Максимум шагов (default: 10)
}
```

## Примеры

### Базовое использование

```typescript
import { getAIModel } from "@qbs-autonaim/lib";
import { InterviewerAgentV2 } from "@qbs-autonaim/prompts";

const model = getAIModel();
const agent = new InterviewerAgentV2({ model });

const result = await agent.execute(input, context);

if (result.success) {
  console.log(result.data.nextQuestion);
} else {
  console.error(result.error);
}
```

### С оркестратором

```typescript
import { InterviewOrchestratorV2 } from "@qbs-autonaim/prompts";

const orchestrator = new InterviewOrchestratorV2({
  model: getAIModel(),
  maxSteps: 15,
});

const result = await orchestrator.execute({
  currentAnswer: "Да, готов начать",
  currentQuestion: "Готовы к интервью?",
  previousQA: [],
  questionNumber: 0,
}, context);

if (result.shouldEscalate) {
  console.log("Эскалация:", result.escalationReason);
} else if (result.shouldContinue) {
  console.log("Следующий вопрос:", result.nextQuestion);
}
```

## Advanced Features

### Добавление Tools

См. `examples/interviewer-with-tools.ts` для примера агента с инструментами.

### Loop Control

См. `examples/advanced-loop-control.ts` для примеров:
- Динамическое переключение моделей
- Кастомные условия остановки
- Фазовое выполнение

## Миграция с V1

См. `MIGRATION_V2.md` в корне пакета.

## Архитектура

```
BaseToolLoopAgent (абстрактный)
  ├── InterviewerAgentV2
  ├── EscalationDetectorAgentV2
  └── InterviewCompletionAgentV2

InterviewOrchestratorV2 (координатор)
```

Каждый агент:
1. Наследуется от `BaseToolLoopAgent`
2. Определяет Zod схему для output
3. Реализует `validate()` и `buildPrompt()`
4. Автоматически получает structured output через AI SDK
