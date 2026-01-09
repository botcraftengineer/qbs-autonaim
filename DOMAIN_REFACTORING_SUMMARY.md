# Рефакторинг: Перенос Custom Domains с Organization на Workspace

## Причина изменений

Для кадровых агентств, где каждый workspace представляет отдельного клиента (компанию), необходимо, чтобы каждый клиент мог иметь свой брендированный домен для интервью.

### Пример использования:
```
Organization: "HR Solutions" (кадровое агентство)
├── Workspace: "Яндекс" → career.yandex.ru
├── Workspace: "Сбер" → job.sber.ru
└── Workspace: "Внутренний найм" → jobs.hrsolutions.ru
```

## Выполненные изменения

### 1. Database Schema

#### Создано:
- `packages/db/src/schema/workspace/custom-domain.ts` - новая таблица `custom_domains`
  - Связь с `workspace` вместо `organization`
  - Enum `domain_type` (interview, prequalification)
  - Индексы для быстрого поиска по workspace, домену, типу

#### Удалено:
- `packages/db/src/schema/organization/custom-domain.ts` - старая таблица `organization_custom_domains`
- Поле `interviewDomain` из `workspace.ts` (заменено таблицей)

#### Обновлено:
- `packages/db/src/schema/workspace/relations.ts` - добавлена связь `customDomains`
- `packages/db/src/schema/workspace/index.ts` - экспорт `custom-domain`
- `packages/db/src/schema/organization/relations.ts` - удалена связь `customDomains`

### 2. API Routes

#### Создано:
- `packages/api/src/routers/workspace/custom-domain/` - новые роуты
  - `create.ts` - создание домена для workspace
  - `list.ts` - список доменов workspace
  - `verify.ts` - верификация домена
  - `set-primary.ts` - установка основного домена
  - `delete.ts` - удаление домена
  - `index.ts` - экспорт роутера

#### Удалено:
- `packages/api/src/routers/custom-domain/` - старые роуты organization

#### Обновлено:
- `packages/api/src/routers/workspace/index.ts` - добавлен `customDomain` роутер
- `packages/api/src/root.ts` - удален старый `customDomain` роутер

### 3. Services

#### Обновлено:
- `packages/api/src/services/interview-link-generator.ts`
  - `getBaseUrlForOrganization()` → `getBaseUrlForWorkspace()`
  - Параметр `organizationId` → `workspaceId`
  - Использует `workspaceCustomDomain` вместо `organizationCustomDomain`

### 4. Frontend (требует обновления)

Следующие компоненты используют старый API и требуют обновления:
- `apps/app/src/components/organization/domain-card.tsx`
- `apps/app/src/components/organization/custom-domains-section.tsx`
- `apps/app/src/components/organization/delete-domain-dialog.tsx`
- `apps/app/src/components/organization/add-domain-dialog.tsx`

Изменения:
```typescript
// Было:
trpc.customDomain.list.queryOptions({ organizationId })

// Стало:
trpc.workspace.customDomain.list.queryOptions({ workspaceId })
```

## Новый API

### Использование на клиенте:

```typescript
// Список доменов workspace
const { data: domains } = api.workspace.customDomain.list.useQuery({
  workspaceId: "ws_xxx",
  type: "interview" // optional
});

// Создание домена
const createMutation = api.workspace.customDomain.create.useMutation();
await createMutation.mutateAsync({
  workspaceId: "ws_xxx",
  domain: "career.example.com",
  type: "interview"
});

// Верификация
const verifyMutation = api.workspace.customDomain.verify.useMutation();
await verifyMutation.mutateAsync({ domainId: "uuid" });

// Установка основного
const setPrimaryMutation = api.workspace.customDomain.setPrimary.useMutation();
await setPrimaryMutation.mutateAsync({ domainId: "uuid" });

// Удаление
const deleteMutation = api.workspace.customDomain.delete.useMutation();
await deleteMutation.mutateAsync({ domainId: "uuid" });
```

## Проверка прав доступа

Все роуты проверяют, что пользователь является членом workspace с ролью `owner` или `admin`:

```typescript
const member = await db.query.workspaceMember.findFirst({
  where: (member, { eq, and }) =>
    and(
      eq(member.workspaceId, input.workspaceId),
      eq(member.userId, ctx.session.user.id),
    ),
});

if (!member || (member.role !== "owner" && member.role !== "admin")) {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Недостаточно прав",
  });
}
```

## Преимущества новой архитектуры

✅ **Изоляция клиентов** - каждый workspace управляет своими доменами
✅ **Права доступа** - только члены workspace могут управлять доменами
✅ **Брендинг** - каждый клиент видит свой домен
✅ **Масштабируемость** - легко добавлять новых клиентов
✅ **Безопасность** - домены изолированы по workspace

## TODO

1. Обновить frontend компоненты для использования нового API
2. Создать миграцию для переноса данных из `organization_custom_domains` в `workspace_custom_domains`
3. Обновить документацию API
4. Добавить тесты для новых роутов
