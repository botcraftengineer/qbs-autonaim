# API Router Structure

Единая структура роутеров с понятными названиями и логической организацией.

## Стандарты

- Файлы именуются по действию: `list.ts`, `get.ts`, `create.ts`, `update.ts`, `delete.ts`
- Специфичные действия: `action-name.ts` (kebab-case)
- Каждый роутер экспортирует объект с `satisfies TRPCRouterRecord`
- Вложенные роутеры для группировки связанной функциональности

## Структура

```
routers/
├── company/
│   ├── get.ts
│   ├── update.ts
│   └── index.ts
│
├── integration/
│   ├── list.ts
│   ├── create.ts
│   ├── update.ts
│   ├── delete.ts
│   └── index.ts
│
├── telegram/
│   ├── auth.ts
│   ├── conversation.ts
│   ├── messages.ts
│   ├── send.ts
│   ├── send-user.ts
│   ├── file.ts
│   ├── transcribe.ts
│   └── index.ts
│
├── user/
│   ├── me.ts
│   ├── update.ts
│   ├── delete.ts
│   └── index.ts
│
├── vacancy/
│   ├── list.ts
│   ├── list-active.ts
│   ├── get.ts
│   ├── update.ts
│   ├── analytics.ts
│   ├── dashboard-stats.ts
│   ├── responses-chart.ts
│   ├── improve-instructions.ts
│   ├── responses/
│   │   ├── list.ts
│   │   ├── list-all.ts
│   │   ├── list-recent.ts
│   │   ├── list-top.ts
│   │   ├── get.ts
│   │   ├── count.ts
│   │   ├── send-welcome.ts
│   │   ├── send-by-username.ts
│   │   └── index.ts
│   └── index.ts
│
└── workspace/
    ├── list.ts
    ├── get.ts
    ├── get-by-slug.ts
    ├── create.ts
    ├── update.ts
    ├── delete.ts
    ├── members/
    │   ├── list.ts
    │   ├── add.ts
    │   ├── remove.ts
    │   ├── update-role.ts
    │   └── index.ts
    ├── invites/
    │   ├── list.ts
    │   ├── create-link.ts
    │   ├── get-link.ts
    │   ├── get-by-token.ts
    │   ├── pending.ts
    │   ├── accept.ts
    │   ├── resend.ts
    │   ├── cancel.ts
    │   └── index.ts
    └── index.ts
```

## API Endpoints

### Company
- `company.get` - получить настройки компании
- `company.update` - обновить настройки

### Integration
- `integration.list` - список интеграций
- `integration.create` - создать интеграцию
- `integration.update` - обновить интеграцию
- `integration.delete` - удалить интеграцию

### Telegram
- `telegram.conversation` - получить диалог
- `telegram.messages` - получить сообщения
- `telegram.send` - отправить сообщение
- `telegram.file` - получить URL файла
- `telegram.transcribe` - транскрибировать голосовое
- `telegram.sendCode` - отправить код авторизации
- `telegram.signIn` - войти
- `telegram.checkPassword` - проверить пароль
- `telegram.getSessions` - получить сессии
- `telegram.deleteSession` - удалить сессию
- `telegram.getSessionStatus` - статус сессии
- `telegram.clearAuthError` - очистить ошибку авторизации
- `telegram.reauthorizeSession` - переавторизовать сессию
- `telegram.sendUserMessage` - отправить сообщение пользователю
- `telegram.sendUserMessageByPhone` - отправить по телефону

### User
- `user.me` - текущий пользователь
- `user.update` - обновить аккаунт
- `user.delete` - удалить аккаунт

### Vacancy
- `vacancy.list` - список вакансий
- `vacancy.listActive` - активные вакансии
- `vacancy.get` - получить вакансию
- `vacancy.update` - обновить настройки
- `vacancy.analytics` - аналитика
- `vacancy.dashboardStats` - статистика дашборда
- `vacancy.responsesChart` - график откликов
- `vacancy.improveInstructions` - улучшить инструкции
- `vacancy.responses.list` - список откликов
- `vacancy.responses.listAll` - все отклики
- `vacancy.responses.listRecent` - недавние отклики
- `vacancy.responses.listTop` - топ отклики
- `vacancy.responses.get` - получить отклик
- `vacancy.responses.count` - количество откликов
- `vacancy.responses.sendWelcome` - отправить приветствие
- `vacancy.responses.sendByUsername` - отправить по username

### Workspace
- `workspace.list` - список workspace
- `workspace.get` - получить workspace
- `workspace.getBySlug` - получить по slug
- `workspace.create` - создать workspace
- `workspace.update` - обновить workspace
- `workspace.delete` - удалить workspace
- `workspace.members.list` - список участников
- `workspace.members.add` - добавить участника
- `workspace.members.remove` - удалить участника
- `workspace.members.updateRole` - обновить роль
- `workspace.invites.list` - список приглашений
- `workspace.invites.createLink` - создать ссылку-приглашение
- `workspace.invites.getLink` - получить активную ссылку
- `workspace.invites.getByToken` - получить по токену
- `workspace.invites.pending` - ожидающие приглашения
- `workspace.invites.accept` - принять приглашение
- `workspace.invites.resend` - переотправить приглашение
- `workspace.invites.cancel` - отменить приглашение
