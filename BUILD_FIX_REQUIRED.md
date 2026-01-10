# Build Fix Required

## Проблема

Сборка проекта не проходит из-за несоответствия между кодом и схемой базы данных.

**Ошибок:** 364 в 77 файлах

## Причина

Код в `packages/api` был написан в ожидании универсальных таблиц:
- `response` (вместо `vacancyResponse` / `gigResponse`)
- `conversation` (вместо `interviewSession`)
- `conversationMessage` (вместо `interviewMessage`)

Эти универсальные таблицы были запланированы согласно документации (`UNIVERSAL_CHAT_MIGRATION.md`, `UNIVERSAL_RESPONSES_SCHEMA.md`), но не были созданы.

## Основные проблемы

### 1. Response Tables
Код ожидает:
- `response.entityType` (enum: 'gig' | 'vacancy')
- `response.entityId` (UUID вакансии/гига)

Реально существует:
- `vacancyResponse.vacancyId`
- `gigResponse.gigId`

### 2. Conversation Tables
Код ожидает:
- `conversation.responseId`
- `conversation.source` ('WEB' | 'TELEGRAM')
- `conversation.username`
- `conversationMessage.sender` ('USER' | 'BOT')
- `conversationMessage.contentType`

Реально существует:
- `interviewSession.vacancyResponseId` / `gigResponseId`
- `interviewSession.entityType` ('vacancy_response' | 'gig_response')
- `interviewMessage.role` ('user' | 'assistant' | 'system')
- `interviewMessage.channel` ('web' | 'telegram' | 'whatsapp' | 'max')

### 3. Missing Fields
Код использует поля, которых нет в реальных таблицах:
- `response.candidateId` (есть только `resumeId` в vacancy)
- `response.proposedPrice` (есть только в gig)
- `response.compositeScore`, `strengths`, `weaknesses`, `recommendation`
- `interviewScoring.conversationId` (должно быть `interviewSessionId`)
- `prequalificationSession.conversationId`

## Решения

### Вариант 1: Создать универсальные таблицы (рекомендуется)

1. Создать таблицы согласно `UNIVERSAL_RESPONSES_SCHEMA.md`:
   - `responses` с полями `entityType`, `entityId`
   - `conversations` с полями `responseId`, `source`
   - `conversation_messages` с полями `conversationId`, `sender`

2. Мигрировать данные:
   - `vacancy_responses` → `responses` (entityType='vacancy')
   - `gig_responses` → `responses` (entityType='gig')
   - `interview_sessions` → `conversations`
   - `interview_messages` → `conversation_messages`

3. Обновить relations в Drizzle

4. Удалить старые таблицы после миграции

### Вариант 2: Переписать код под существующие таблицы

1. Заменить все `response.entityId` на `vacancyResponse.vacancyId`
2. Заменить все `response.entityType` проверки на прямые проверки таблиц
3. Обновить все запросы для использования `interviewSession` вместо `conversation`
4. Исправить все поля, которые отличаются между vacancy и gig

**Объем работы:** ~77 файлов, ~364 ошибки

## Временное решение

Создан алиас `conversation = interviewSession` для частичной совместимости, но это не решает проблему с отсутствующими полями.

## Рекомендация

Выбрать **Вариант 1** (универсальные таблицы), так как:
- Это было изначальным планом (см. документацию)
- Упрощает код (один набор таблиц для всех типов)
- Легче добавлять новые типы (project, team и т.д.)
- Меньше дублирования кода

## Следующие шаги

1. Создать универсальные таблицы в `packages/db/src/schema/universal/`
2. Создать SQL миграцию для переноса данных
3. Обновить relations
4. Протестировать на dev окружении
5. Выполнить миграцию на production
6. Удалить старые таблицы

## Файлы для справки

- `UNIVERSAL_CHAT_MIGRATION.md` - план миграции чатов
- `UNIVERSAL_RESPONSES_SCHEMA.md` - схема универсальных откликов
- `packages/db/src/schema/interview/conversation-aliases.ts` - временные алиасы
