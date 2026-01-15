# API Роутеры

Полный список tRPC роутеров платформы с описанием endpoints.

## Обзор

Платформа использует **21 основной роутер** для организации API. Все роутеры type-safe через tRPC и автоматически генерируют TypeScript типы для клиента.

## Структура роутеров

### 1. analytics - Аналитика и экспорт

**Endpoints:**
- `getDashboard` - получение данных для главного дашборда
- `getVacancyAnalytics` - аналитика по конкретной вакансии
- `exportData` - экспорт данных в CSV/Excel
- `trackEvent` - отслеживание событий пользователя

**Использование:**
```typescript
const dashboard = await trpc.analytics.getDashboard.query({
  workspaceId: "workspace-id",
  dateRange: { from: "2024-01-01", to: "2024-12-31" }
});
```

---

### 2. candidates - Управление кандидатами

**Endpoints:**
- `list` - список всех кандидатов с фильтрацией
- `getById` - детальная информация о кандидате
- `listActivities` - история активности кандидата
- `listComments` - комментарии по кандидату
- `addComment` - добавление комментария
- `listMessages` - история сообщений
- `invite` - приглашение на интервью
- `sendGreeting` - отправка приветственного сообщения
- `sendOffer` - отправка предложения о работе
- `reject` - отклонение кандидата
- `updateStage` - изменение этапа воронки
- `updateSalary` - обновление зарплатных ожиданий
- `refreshResume` - обновление данных резюме

**Использование:**
```typescript
const candidates = await trpc.candidates.list.query({
  workspaceId: "workspace-id",
  filters: { stage: "INTERVIEW", minScore: 4 }
});
```

---

### 3. chat - Чат-сессии

**Endpoints:**
- `createSession` - создание новой чат-сессии
- `listSessions` - список всех сессий
- `getHistory` - история сообщений сессии
- `sendMessage` - отправка сообщения
- `clearHistory` - очистка истории

**Использование:**
```typescript
const session = await trpc.chat.createSession.mutate({
  workspaceId: "workspace-id",
  type: "RECRUITER_AGENT"
});
```

---

### 4. company - Информация о компании

**Endpoints:**
- `get` - получение данных компании
- `update` - обновление всех данных
- `updatePartial` - частичное обновление
- `updateOnboarding` - обновление статуса онбординга

**Использование:**
```typescript
const company = await trpc.company.get.query({
  workspaceId: "workspace-id"
});
```

---

### 5. custom-domain - Кастомные домены

**Endpoints:**
- `list` - список доменов
- `create` - добавление нового домена
- `delete` - удаление домена
- `verify` - верификация домена
- `setPrimary` - установка основного домена
- `checkAvailability` - проверка доступности
- `listPresets` - список готовых пресетов

**Использование:**
```typescript
const domain = await trpc.customDomain.create.mutate({
  workspaceId: "workspace-id",
  domain: "interview.company.com"
});
```

---

### 6. files - Работа с файлами

**Endpoints:**
- `getFileUrl` - получение presigned URL для скачивания
- `getImage` - получение изображения
- `uploadInterviewMedia` - загрузка медиа для интервью
- `getInterviewMedia` - получение медиа интервью

**Использование:**
```typescript
const url = await trpc.files.getFileUrl.query({
  fileId: "file-id",
  expiresIn: 3600
});
```

---

### 7. freelance-platforms - Фриланс-платформы

**Endpoints:**
- `getVacancies` - список вакансий с платформ
- `getVacancyById` - детали вакансии
- `getVacancyByToken` - получение по токену
- `createVacancy` - создание вакансии
- `deleteVacancy` - удаление вакансии
- `updateVacancyStatus` - изменение статуса
- `mergeVacancies` - объединение вакансий
- `getAnalytics` - аналитика по платформам
- `getDashboardStats` - статистика для дашборда
- `exportAnalytics` - экспорт аналитики
- `getShortlist` - список избранных кандидатов
- `importBulkResponses` - массовый импорт откликов
- `importSingleResponse` - импорт одного отклика
- `previewBulkImport` - предпросмотр импорта
- `retryBulkImport` - повтор импорта
- `retryAnalysis` - повтор анализа
- `syncGigResponses` - синхронизация откликов gig
- `generateInterviewLink` - генерация ссылки на интервью
- `getInterviewLink` - получение ссылки
- `getInterviewByToken` - получение интервью по токену
- `validateInterviewToken` - валидация токена
- `checkInterviewAccess` - проверка доступа
- `startInterview` - начало интервью
- `startWebInterview` - начало веб-интервью
- `getWebInterviewStatus` - статус веб-интервью
- `getChatHistory` - история чата интервью
- `getInterviewContext` - контекст интервью
- `getNewMessages` - новые сообщения
- `sendChatMessage` - отправка сообщения в чат
- `subscribeToChat` - подписка на сообщения
- `checkDuplicateResponse` - проверка дубликатов

**Использование:**
```typescript
const vacancies = await trpc.freelancePlatforms.getVacancies.query({
  workspaceId: "workspace-id",
  platform: "KWORK"
});
```

---

### 8. funnel - Воронка продаж

**Endpoints:**
- `list` - список этапов воронки
- `analytics` - аналитика по воронке
- `vacancyStats` - статистика по вакансии
- `updateStage` - обновление этапа
- `mapResponseStage` - маппинг этапа отклика

**Использование:**
```typescript
const funnel = await trpc.funnel.analytics.query({
  workspaceId: "workspace-id",
  vacancyId: "vacancy-id"
});
```

---

### 9. gig - Управление gig-заданиями

**Endpoints:**
- `list` - список всех gig
- `listActive` - только активные gig
- `get` - детали gig
- `create` - создание gig
- `update` - обновление gig
- `delete` - удаление gig
- `shortlist` - избранные кандидаты
- `aiChat` - AI чат для gig
- `chatGenerate` - генерация текста через AI

**Подроутер responses:**
- `list` - список откликов
- `get` - детали отклика
- `count` - подсчет откликов
- `create` - создание отклика
- `updateStatus` - обновление статуса
- `accept` - принятие отклика
- `reject` - отклонение отклика
- `sendMessage` - отправка сообщения

**Использование:**
```typescript
const gigs = await trpc.gig.list.query({
  workspaceId: "workspace-id",
  status: "ACTIVE"
});

const responses = await trpc.gig.responses.list.query({
  gigId: "gig-id",
  workspaceId: "workspace-id"
});
```

---

### 10. integration - Интеграции

**Endpoints:**
- `list` - список всех интеграций
- `create` - добавление интеграции
- `update` - обновление интеграции
- `delete` - удаление интеграции

**Использование:**
```typescript
const integrations = await trpc.integration.list.query({
  workspaceId: "workspace-id"
});

await trpc.integration.create.mutate({
  workspaceId: "workspace-id",
  type: "HH",
  credentials: { email: "user@example.com", password: "***" }
});
```

---

### 11. organization - Управление организацией

**Endpoints:**
- `list` - список организаций пользователя
- `get` - детали организации
- `getBySlug` - получение по slug
- `create` - создание организации
- `update` - обновление организации
- `delete` - удаление организации

**Подроутеры:**
- `members.*` - управление участниками
- `invites.*` - управление приглашениями
- `workspaces.*` - управление workspace

**Использование:**
```typescript
const org = await trpc.organization.create.mutate({
  name: "Моя компания",
  slug: "my-company"
});
```

---

### 12. prequalification - Предквалификация

**Endpoints:**
- `createSession` - создание сессии предквалификации
- `getSession` - получение сессии
- `sendMessage` - отправка сообщения
- `uploadResume` - загрузка резюме
- `submitApplication` - отправка заявки
- `getResult` - получение результата

**Использование:**
```typescript
const session = await trpc.prequalification.createSession.mutate({
  vacancyId: "vacancy-id"
});
```

---

### 13. recruiter-agent - AI помощник рекрутера

**Endpoints:**
- `chat` - чат с AI агентом
- `getRecommendations` - получение рекомендаций
- `executeAction` - выполнение действия
- `configureRules` - настройка правил
- `feedback` - обратная связь

**Использование:**
```typescript
const response = await trpc.recruiterAgent.chat.mutate({
  workspaceId: "workspace-id",
  message: "Покажи топ-5 кандидатов на позицию Senior Developer"
});
```

---

### 14. telegram - Telegram интеграция

**Подроутеры:**
- `auth.*` - авторизация Telegram
- `session.*` - управление сессиями
- `messages.*` - работа с сообщениями
- `send.*` - отправка сообщений
- `conversation.*` - управление диалогами
- `file.*` - работа с файлами
- `transcribe.*` - транскрибация голоса

**Основные endpoints:**
- `auth.sendCode` - отправка кода авторизации
- `auth.signIn` - вход по коду
- `auth.checkPassword` - проверка 2FA
- `session.list` - список сессий
- `session.delete` - удаление сессии
- `messages.getHistory` - история сообщений
- `send.byUsername` - отправка по username
- `send.byChatId` - отправка по chat ID
- `send.byPhone` - отправка по телефону
- `transcribe.voice` - транскрибация голоса

**Использование:**
```typescript
await trpc.telegram.auth.sendCode.mutate({
  workspaceId: "workspace-id",
  phone: "+79991234567"
});

await trpc.telegram.send.byUsername.mutate({
  workspaceId: "workspace-id",
  username: "candidate_username",
  message: "Здравствуйте! Приглашаем вас на интервью."
});
```

---

### 15. user - Управление пользователем

**Endpoints:**
- `me` - получение профиля текущего пользователя
- `update` - обновление профиля
- `delete` - удаление аккаунта
- `setActiveWorkspace` - установка активного workspace
- `clearActiveWorkspace` - очистка активного workspace
- `checkWorkspaceAccess` - проверка доступа к workspace

**Использование:**
```typescript
const user = await trpc.user.me.query();

await trpc.user.setActiveWorkspace.mutate({
  workspaceId: "workspace-id"
});
```

---

### 16. vacancy - Управление вакансиями

**Endpoints:**
- `list` - список всех вакансий
- `listActive` - только активные вакансии
- `get` - детали вакансии
- `create` - создание вакансии
- `createFromChat` - создание из чата с AI
- `update` - обновление вакансии
- `updateDetails` - обновление деталей
- `delete` - удаление вакансии
- `analytics` - аналитика по вакансии
- `dashboardStats` - статистика для дашборда
- `responsesChart` - график откликов
- `chatGenerate` - генерация текста через AI
- `improveInstructions` - улучшение инструкций через AI

**Подроутер responses:**
- `list` - список откликов
- `get` - детали отклика
- `count` - подсчет откликов
- `updateStatus` - обновление статуса
- `accept` - принятие отклика
- `reject` - отклонение отклика
- `sendMessage` - отправка сообщения

**Использование:**
```typescript
const vacancies = await trpc.vacancy.list.query({
  workspaceId: "workspace-id",
  filters: { status: "ACTIVE" }
});

const responses = await trpc.vacancy.responses.list.query({
  vacancyId: "vacancy-id",
  workspaceId: "workspace-id"
});
```

---

### 17. widget-config - Конфигурация виджетов

**Endpoints:**
- `getConfig` - получение конфигурации виджета
- `updateConfig` - обновление конфигурации

**Использование:**
```typescript
const config = await trpc.widgetConfig.getConfig.query({
  workspaceId: "workspace-id"
});
```

---

### 18. workspace - Управление workspace

**Endpoints:**
- `list` - список workspace пользователя
- `get` - детали workspace
- `getBySlug` - получение по slug
- `create` - создание workspace
- `update` - обновление workspace
- `delete` - удаление workspace
- `getBotSettings` - получение настроек бота
- `updateBotSettings` - обновление настроек бота

**Подроутеры:**
- `members.*` - управление участниками
- `invites.*` - управление приглашениями

**Использование:**
```typescript
const workspace = await trpc.workspace.create.mutate({
  organizationId: "org-id",
  name: "Отдел разработки",
  slug: "dev-team"
});
```

---

### 19. utils - Утилиты

**Endpoints:**
- `sanitizeHtml` - очистка HTML от опасного кода

**Использование:**
```typescript
const clean = await trpc.utils.sanitizeHtml.mutate({
  html: "<script>alert('xss')</script><p>Safe content</p>"
});
```

---

### 20. test - Тестовые endpoints

**Endpoints:**
- `setup` - настройка тестового окружения

**Использование:**
```typescript
// Только для разработки и тестирования
await trpc.test.setup.mutate();
```

---

## Middleware и защита

### Публичные роутеры
- `freelancePlatforms.*` - частично публичные (интервью)
- `prequalification.*` - публичные

### Защищенные роутеры
Все остальные роутеры требуют авторизации через Better Auth.

### Проверка workspace
Большинство endpoints проверяют принадлежность пользователя к workspace:

```typescript
// Автоматическая проверка в middleware
const vacancy = await trpc.vacancy.get.query({
  id: "vacancy-id",
  workspaceId: "workspace-id" // Проверяется доступ
});
```

## Type Safety

Все роутеры полностью типизированы:

```typescript
// Автокомплит и проверка типов
const result = await trpc.vacancy.create.mutate({
  workspaceId: "workspace-id",
  title: "Senior Developer",
  // TypeScript подскажет все доступные поля
});

// Типы ответа тоже известны
result.id; // string
result.title; // string
result.createdAt; // Date
```

## Обработка ошибок

```typescript
try {
  await trpc.vacancy.delete.mutate({ id: "vacancy-id" });
} catch (error) {
  if (error.code === "NOT_FOUND") {
    console.error("Вакансия не найдена");
  } else if (error.code === "FORBIDDEN") {
    console.error("Нет доступа");
  }
}
```

## Подписки (Subscriptions)

Некоторые роутеры поддерживают real-time подписки:

```typescript
// Подписка на новые сообщения в чате
trpc.freelancePlatforms.subscribeToChat.subscribe(
  { conversationId: "conv-id" },
  {
    onData: (message) => {
      console.log("Новое сообщение:", message);
    }
  }
);
```

## Производительность

- **Кэширование** - React Query автоматически кэширует запросы
- **Дедупликация** - одинаковые запросы объединяются
- **Оптимистичные обновления** - UI обновляется до ответа сервера
- **Инвалидация** - автоматическое обновление связанных данных

```typescript
// Оптимистичное обновление
const utils = trpc.useUtils();

await utils.vacancy.update.mutate(
  { id: "vacancy-id", title: "New Title" },
  {
    onSuccess: () => {
      // Инвалидация связанных запросов
      utils.vacancy.list.invalidate();
      utils.vacancy.get.invalidate({ id: "vacancy-id" });
    }
  }
);
```
