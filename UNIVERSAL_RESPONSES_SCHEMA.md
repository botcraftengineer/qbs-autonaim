# Универсальные таблицы откликов

## Обзор

Вместо отдельных таблиц для каждого типа сущности (`gig_responses`, `vacancy_responses`), создана единая универсальная система таблиц с полиморфной связью.

## Структура таблиц

### 1. responses (главная таблица)

Универсальная таблица откликов для всех типов сущностей.

**Полиморфная связь:**
- `entityType` - тип сущности (gig, vacancy, project)
- `entityId` - ID сущности

**Основные поля:**
- Идентификация кандидата: `candidateId`, `candidateName`, `profileUrl`
- Контакты: `telegramUsername`, `chatId`, `phone`, `email`, `contacts`
- Предложение (gig): `proposedPrice`, `proposedCurrency`, `proposedDeliveryDays`
- Ожидания (vacancy): `salaryExpectations`
- Портфолио: `portfolioLinks`, `portfolioFileId`, `resumePdfFileId`, `photoFileId`
- Опыт: `experience`, `profileData`, `skills`, `rating`
- Статусы: `status`, `hrSelectionStatus`, `importSource`
- Ranking: `compositeScore`, `rankingPosition`, `strengths`, `weaknesses`, `recommendation`
- Даты: `respondedAt`, `welcomeSentAt`, `createdAt`, `updatedAt`

**Уникальность:**
```sql
UNIQUE (entityType, entityId, candidateId)
```
Один кандидат может откликнуться на одну сущность только раз.

### 2. response_screenings

Результаты скрининга откликов (AI анализ).

**Поля:**
- `responseId` - ссылка на отклик
- `score` - оценка 0-5
- `detailedScore` - детальная оценка 0-100
- `analysis` - общий анализ
- `priceAnalysis` - анализ цены/зарплаты
- `deliveryAnalysis` - анализ сроков
- `skillsAnalysis` - анализ навыков
- `experienceAnalysis` - анализ опыта

### 3. response_invitations

Приглашения на интервью.

**Поля:**
- `responseId` - ссылка на отклик
- `invitationText` - текст приглашения
- `interviewUrl` - ссылка на интервью
- `createdAt` - дата создания

### 4. interview_links

Ссылки на интервью для сущностей.

**Полиморфная связь:**
- `entityType` - тип сущности (gig, vacancy, project)
- `entityId` - ID сущности

**Поля:**
- `token` - уникальный токен ссылки
- `isActive` - активна ли ссылка
- `expiresAt` - дата истечения

## Сравнение со старой схемой

### Было (старая схема)

```
gig_responses (50+ полей)
  ├── gig_response_screenings
  ├── gig_invitations
  └── gig_interview_links

vacancy_responses (30+ полей)
  └── (нет screening, invitations, interview_links)
```

**Проблемы:**
- Дублирование 80% полей между gig и vacancy
- Vacancy не имеет screening, invitations, interview_links
- Для каждого нового типа нужно создавать 4 таблицы
- Сложно добавлять новые поля для всех типов

### Стало (новая схема)

```
responses (универсальная, 50+ полей)
  ├── response_screenings (универсальная)
  ├── response_invitations (универсальная)
  └── interview_links (универсальная)
```

**Преимущества:**
- Одна таблица для всех типов
- Все функции доступны для всех типов
- Новый тип = просто добавить значение в enum
- Новое поле = одно изменение для всех типов

## Примеры использования

### Создание отклика для gig

```typescript
await db.insert(response).values({
  entityType: "gig",
  entityId: gigId,
  candidateId: "candidate123",
  candidateName: "Иван Иванов",
  proposedPrice: 50000,
  proposedCurrency: "RUB",
  proposedDeliveryDays: 7,
  coverLetter: "Готов выполнить задание...",
  skills: ["React", "TypeScript"],
  status: "NEW",
});
```

### Создание отклика для vacancy

```typescript
await db.insert(response).values({
  entityType: "vacancy",
  entityId: vacancyId,
  candidateId: "resume456",
  candidateName: "Петр Петров",
  salaryExpectations: "150000-200000 RUB",
  coverLetter: "Хочу работать у вас...",
  skills: ["Node.js", "PostgreSQL"],
  status: "NEW",
});
```

### Получение откликов для gig

```typescript
const responses = await db.query.response.findMany({
  where: and(
    eq(response.entityType, "gig"),
    eq(response.entityId, gigId)
  ),
});
```

### Создание screening для любого отклика

```typescript
await db.insert(responseScreening).values({
  responseId: response.id,
  score: 4,
  detailedScore: 85,
  analysis: "Кандидат хорошо подходит...",
  skillsAnalysis: "Все необходимые навыки присутствуют",
});
```

## Миграция данных

### Шаг 1: Миграция gig_responses

```sql
INSERT INTO responses (
  entity_type, entity_id, candidate_id, candidate_name,
  proposed_price, proposed_currency, proposed_delivery_days,
  cover_letter, portfolio_links, experience, skills,
  status, hr_selection_status, import_source,
  composite_score, ranking_position, strengths, weaknesses, recommendation,
  responded_at, welcome_sent_at, created_at, updated_at
)
SELECT 
  'gig', gig_id, candidate_id, candidate_name,
  proposed_price, proposed_currency, proposed_delivery_days,
  cover_letter, portfolio_links, experience, skills,
  status::text::universal_response_status, 
  hr_selection_status::text::universal_hr_selection_status,
  import_source::text::universal_import_source,
  composite_score, ranking_position, strengths, weaknesses,
  recommendation::text::universal_recommendation,
  responded_at, welcome_sent_at, created_at, updated_at
FROM gig_responses;
```

### Шаг 2: Миграция vacancy_responses

```sql
INSERT INTO responses (
  entity_type, entity_id, candidate_id, candidate_name,
  salary_expectations, cover_letter, experience, profile_data,
  status, hr_selection_status, import_source,
  responded_at, welcome_sent_at, created_at, updated_at
)
SELECT 
  'vacancy', vacancy_id, resume_id, candidate_name,
  salary_expectations, cover_letter, experience, profile_data,
  status::text::universal_response_status,
  hr_selection_status::text::universal_hr_selection_status,
  import_source::text::universal_import_source,
  responded_at, welcome_sent_at, created_at, updated_at
FROM vacancy_responses;
```

### Шаг 3: Миграция связанных таблиц

```sql
-- Screenings
INSERT INTO response_screenings (response_id, score, detailed_score, analysis, ...)
SELECT new_response_id, score, detailed_score, analysis, ...
FROM gig_response_screenings
JOIN response_id_mapping ON ...;

-- Invitations
INSERT INTO response_invitations (response_id, invitation_text, interview_url, created_at)
SELECT new_response_id, invitation_text, interview_url, created_at
FROM gig_invitations
JOIN response_id_mapping ON ...;

-- Interview Links
INSERT INTO interview_links (entity_type, entity_id, token, is_active, expires_at, created_at)
SELECT 'gig', gig_id, token, is_active, expires_at, created_at
FROM gig_interview_links;
```

## Обновление кода

### Было

```typescript
// Для gig
const gigResponses = await db.query.gigResponse.findMany({
  where: eq(gigResponse.gigId, gigId),
});

// Для vacancy
const vacancyResponses = await db.query.vacancyResponse.findMany({
  where: eq(vacancyResponse.vacancyId, vacancyId),
});
```

### Стало

```typescript
// Универсально для всех типов
const responses = await db.query.response.findMany({
  where: and(
    eq(response.entityType, entityType), // 'gig' | 'vacancy' | 'project'
    eq(response.entityId, entityId),
  ),
});
```

## Добавление нового типа (project)

1. Добавить в enum:
```typescript
export const responseEntityTypeEnum = pgEnum("response_entity_type", [
  "gig",
  "vacancy",
  "project", // новый тип
]);
```

2. Использовать сразу:
```typescript
await db.insert(response).values({
  entityType: "project",
  entityId: projectId,
  candidateId: "candidate789",
  // ... остальные поля
});
```

Все функции (screening, invitations, interview links) автоматически доступны для нового типа!

## Преимущества

✅ **Меньше таблиц** - 4 вместо 8+ (и растет с каждым типом)
✅ **Единая схема** - проще миграции и обновления
✅ **Все функции для всех** - screening, invitations, links для всех типов
✅ **Проще запросы** - один паттерн для всех типов
✅ **Легче добавлять типы** - просто значение в enum
✅ **Меньше дублирования** - в коде, тестах, документации
✅ **Централизованная валидация** - одна схема Zod для всех
