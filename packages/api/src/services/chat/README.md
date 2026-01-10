# Универсальная система AI чата

Универсальная система для добавления AI чата к любым сущностям в приложении (gig, vacancy, project и т.д.).

## Архитектура

### Компоненты

1. **Схема БД** (`packages/db/src/schema/chat/`)
   - `chat_sessions` - универсальная таблица сессий (полиморфная связь)
   - `chat_messages` - сообщения чата

2. **Backend** (`packages/api/src/services/chat/`)
   - `types.ts` - типы и интерфейсы
   - `prompt-builder.ts` - универсальный построитель промптов
   - `rate-limiter.ts` - универсальный rate limiter
   - `registry.ts` - реестр типов сущностей
   - `loaders/` - загрузчики контекста для каждого типа
   - `configs/` - конфигурации промптов для каждого типа

3. **API** (`packages/api/src/routers/chat/`)
   - `sendMessage` - отправка сообщения
   - `getHistory` - получение истории
   - `clearHistory` - очистка истории

4. **Frontend** (`apps/app/src/components/chat/`)
   - `UniversalChatPanel` - универсальный компонент чата
   - Вспомогательные компоненты (ChatInput, ChatMessageList и т.д.)

## Добавление нового типа сущности

### 1. Создать Context Loader

```typescript
// packages/api/src/services/chat/loaders/vacancy-loader.ts
import type { ChatContext, ContextLoader } from "../types";

export class VacancyContextLoader implements ContextLoader {
  async loadContext(database, vacancyId): Promise<ChatContext | null> {
    // Загрузка данных vacancy
    const vacancy = await database.query.vacancy.findFirst(...);
    
    // Загрузка связанных данных (кандидаты, отклики и т.д.)
    const candidates = await database.query.vacancyResponse.findMany(...);
    
    // Расчет статистики
    const statistics = this.calculateStatistics(candidates);
    
    return {
      entityType: "vacancy",
      entityId: vacancyId,
      mainContext: { ...vacancy },
      relatedContext: { candidates },
      statistics,
    };
  }
}
```

### 2. Создать Prompt Config

```typescript
// packages/api/src/services/chat/configs/vacancy-config.ts
import type { PromptConfig } from "../types";

export const vacancyPromptConfig: PromptConfig = {
  systemRole: `Ты — AI-помощник для анализа кандидатов на вакансию...`,
  
  contextFormatters: {
    main: (ctx) => {
      // Форматирование основного контекста vacancy
      return `# Информация о вакансии\n...`;
    },
    related: (ctx) => {
      // Форматирование кандидатов
      return `# Кандидаты\n...`;
    },
    statistics: (ctx) => {
      // Форматирование статистики
      return `# Статистика\n...`;
    },
  },
  
  welcomeMessage: "Добро пожаловать в AI помощник по вакансии!",
};
```

### 3. Зарегистрировать в системе

```typescript
// packages/api/src/services/chat/register-entities.ts
import { VacancyContextLoader } from "./loaders/vacancy-loader";
import { vacancyPromptConfig } from "./configs/vacancy-config";

export function registerChatEntities(): void {
  // ... существующие регистрации
  
  chatRegistry.register({
    entityType: "vacancy",
    loader: new VacancyContextLoader(),
    promptConfig: vacancyPromptConfig,
    rateLimitConfig: {
      maxRequests: 20,
      windowMs: 60000,
    },
  });
}
```

### 4. Добавить тип в enum (если нужно)

```typescript
// packages/db/src/schema/chat/session.ts
export const chatEntityTypeEnum = pgEnum("chat_entity_type", [
  "gig",
  "vacancy",
  "project", // новый тип
  "team",
]);
```

### 5. Использовать в UI

```typescript
// apps/app/src/components/vacancy/vacancy-ai-chat-panel.tsx
import { UniversalChatPanel } from "~/components/chat";

export function VacancyAIChatPanel({ vacancyId, isOpen, onClose }) {
  return (
    <UniversalChatPanel
      entityType="vacancy"
      entityId={vacancyId}
      isOpen={isOpen}
      onClose={onClose}
      title="AI Помощник по вакансии"
      description="Задавайте вопросы о кандидатах"
    />
  );
}
```

## API Usage

### Отправка сообщения

```typescript
const { mutate } = useMutation(
  trpc.chat.sendMessage.mutationOptions({
    onSuccess: (data) => {
      console.log(data.message);
      console.log(data.quickReplies);
    },
  })
);

mutate({
  entityType: "gig",
  entityId: "uuid",
  message: "Кто лучший кандидат?",
});
```

### Получение истории

```typescript
const { data } = useQuery(
  trpc.chat.getHistory.queryOptions({
    entityType: "gig",
    entityId: "uuid",
    limit: 50,
  })
);
```

### Очистка истории

```typescript
const { mutate } = useMutation(
  trpc.chat.clearHistory.mutationOptions()
);

mutate({
  entityType: "gig",
  entityId: "uuid",
});
```

## Преимущества

1. **Переиспользование кода** - один раз написанная логика работает для всех типов
2. **Легкое расширение** - добавление нового типа требует только loader и config
3. **Централизованное управление** - rate limiting, трейсинг, обработка ошибок в одном месте
4. **Типобезопасность** - полная типизация через TypeScript
5. **Единый UI** - один компонент для всех типов с кастомизацией через props

## Миграция существующего кода

Старый gig-специфичный код (`gig.aiChat.*`) остается работать, но теперь использует универсальную систему под капотом. Новые типы должны использовать универсальный API (`chat.*`).
