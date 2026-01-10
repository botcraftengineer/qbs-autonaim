# Миграция на универсальную систему AI чата и откликов

## Что было сделано

Создана универсальная система AI чата и универсальные таблицы для откликов, которые работают для любых типов сущностей (gig, vacancy, project и т.д.).

## Структура

### 1. База данных - Чаты

**Новые таблицы для чатов:**
- `chat_sessions` - универсальная таблица сессий с полиморфной связью
- `chat_messages` - сообщения чата
- `chat_entity_type` - enum типов сущностей
- `chat_message_role` - enum ролей сообщений

**Файлы:**
- `packages/db/src/schema/chat/session.ts`
- `packages/db/src/schema/chat/index.ts`

### 1.1. База данных - Отклики

**Новые универсальные таблицы для откликов:**
- `responses` - универсальная таблица откликов с полиморфной связью
- `response_screenings` - результаты скрининга откликов
- `response_invitations` - приглашения на интервью
- `interview_links` - ссылки на интервью
- Enum типы: `response_entity_type`, `universal_response_status`, `universal_hr_selection_status`, `universal_import_source`, `universal_recommendation`, `interview_link_entity_type`

**Файлы:**
- `packages/db/src/schema/response/response.ts`
- `packages/db/src/schema/response/screening.ts`
- `packages/db/src/schema/response/invitation.ts`
- `packages/db/src/schema/response/interview-link.ts`
- `packages/db/src/schema/response/index.ts`

**Преимущества универсальных таблиц откликов:**
- Одна таблица вместо `gig_responses` и `vacancy_responses`
- Одна таблица вместо `gig_response_screenings` (vacancy не имел)
- Одна таблица вместо `gig_invitations` (vacancy не имел)
- Одна таблица вместо `gig_interview_links` (vacancy не имел)
- Все функции доступны для всех типов сущностей
- Легко добавить project, team и другие типы

### 2. Backend Services

**Универсальные сервисы:**
- `packages/api/src/services/chat/types.ts` - типы и интерфейсы
- `packages/api/src/services/chat/prompt-builder.ts` - построитель промптов
- `packages/api/src/services/chat/rate-limiter.ts` - rate limiting
- `packages/api/src/services/chat/registry.ts` - реестр типов сущностей

**Gig-специфичные реализации:**
- `packages/api/src/services/chat/loaders/gig-loader.ts` - загрузчик контекста gig
- `packages/api/src/services/chat/configs/gig-config.ts` - конфигурация промпта gig

**Регистрация:**
- `packages/api/src/services/chat/register-entities.ts` - регистрация всех типов

### 3. API Routes

**Универсальный роутер:**
- `packages/api/src/routers/chat/send-message.ts`
- `packages/api/src/routers/chat/get-history.ts`
- `packages/api/src/routers/chat/clear-history.ts`
- `packages/api/src/routers/chat/index.ts`

**Интеграция:**
- `packages/api/src/root.ts` - добавлен `chat` роутер и регистрация типов

### 4. Frontend Components

**Универсальные компоненты:**
- `apps/app/src/components/chat/universal-chat-panel.tsx` - главный компонент
- `apps/app/src/components/chat/chat-input.tsx` - поле ввода
- `apps/app/src/components/chat/chat-message-list.tsx` - список сообщений
- `apps/app/src/components/chat/quick-replies.tsx` - быстрые ответы
- `apps/app/src/components/chat/typing-indicator.tsx` - индикатор печати
- `apps/app/src/components/chat/index.ts` - экспорты

**Обновленный gig компонент:**
- `apps/app/src/components/gig/ai-chat/gig-ai-chat-panel.tsx` - теперь обертка над `UniversalChatPanel`

## Ключевые особенности

### Полиморфная связь

Вместо отдельных таблиц для каждого типа (`gig_chat_sessions`, `vacancy_chat_sessions`), используется одна таблица с полями:
- `entityType` - тип сущности (gig, vacancy, project)
- `entityId` - ID сущности

### Реестр типов

Централизованная регистрация типов через `chatRegistry`:
```typescript
chatRegistry.register({
  entityType: "gig",
  loader: new GigContextLoader(),
  promptConfig: gigPromptConfig,
  rateLimitConfig: { maxRequests: 20, windowMs: 60000 },
});
```

### Универсальный API

Один набор endpoints для всех типов:
```typescript
trpc.chat.sendMessage({ entityType: "gig", entityId, message })
trpc.chat.getHistory({ entityType: "gig", entityId })
trpc.chat.clearHistory({ entityType: "gig", entityId })
```

### Переиспользуемый UI

Один компонент с кастомизацией через props:
```typescript
<UniversalChatPanel
  entityType="gig"
  entityId={gigId}
  title="AI Помощник по кандидатам"
  description="Задавайте вопросы о кандидатах"
/>
```

## Добавление нового типа

Для добавления vacancy чата нужно:

1. Создать `VacancyContextLoader` в `packages/api/src/services/chat/loaders/vacancy-loader.ts`
2. Создать `vacancyPromptConfig` в `packages/api/src/services/chat/configs/vacancy-config.ts`
3. Зарегистрировать в `register-entities.ts`
4. Создать UI обертку `VacancyAIChatPanel` используя `UniversalChatPanel`

## Обратная совместимость

Старый API `gig.aiChat.*` продолжает работать (пока не удален), но новый код должен использовать `chat.*`.

## Следующие шаги

1. **Миграция данных:**
   - Перенести данные из `gig_responses` в `responses` (entityType='gig')
   - Перенести данные из `vacancy_responses` в `responses` (entityType='vacancy')
   - Перенести данные из `gig_response_screenings` в `response_screenings`
   - Перенести данные из `gig_invitations` в `response_invitations`
   - Перенести данные из `gig_interview_links` в `interview_links`
   - Перенести данные из `gig_chat_sessions` в `chat_sessions` (entityType='gig')
   - Перенести данные из `gig_chat_messages` в `chat_messages`

2. **Обновление кода:**
   - Обновить все запросы к старым таблицам на новые
   - Обновить типы и интерфейсы
   - Обновить API endpoints

3. **Добавление новых типов:**
   - Добавить vacancy чат используя новую систему
   - Добавить project чат
   - Добавить screening для vacancy

4. **Очистка:**
   - Удалить старые таблицы после успешной миграции:
     - `gig_responses`, `vacancy_responses`
     - `gig_response_screenings`
     - `gig_invitations`
     - `gig_interview_links`
     - `gig_chat_sessions`, `gig_chat_messages`
   - Удалить старый `gig.aiChat` роутер
   - Удалить старые сервисы `gig-chat/`

## Преимущества

### Чаты
✅ Единая кодовая база для всех типов чатов
✅ Легкое добавление новых типов (3-4 файла)
✅ Централизованное управление rate limiting
✅ Переиспользуемые UI компоненты
✅ Типобезопасность через TypeScript
✅ Меньше дублирования кода
✅ Проще поддерживать и тестировать

### Отклики
✅ Одна таблица вместо множества (`gig_responses`, `vacancy_responses`, ...)
✅ Все функции доступны для всех типов (screening, invitations, interview links)
✅ Единая схема данных - проще миграции и обновления
✅ Меньше JOIN'ов при запросах
✅ Проще добавлять новые поля для всех типов сразу
✅ Централизованная логика валидации и обработки
✅ Меньше дублирования кода в API и сервисах
