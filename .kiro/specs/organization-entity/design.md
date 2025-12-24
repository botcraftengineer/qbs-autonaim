# Design Document: Сущность Организация

## Overview

Данный документ описывает архитектуру и дизайн системы организаций. Организация становится верхним уровнем иерархии:

- Organization → Workspaces → Users
- Organization ← → Users (через organization_members)

Ключевые изменения:

1. Новая таблица `organizations` с префиксом ID `org_`
2. Новая таблица `organization_members` для управления участниками
3. Новая таблица `organization_invites` для приглашений
4. Добавление `organizationId` в таблицу `workspaces`
5. Новая URL структура: `/orgs/[orgSlug]/workspaces/[workspaceSlug]`

## Architecture

### Иерархия сущностей

```
User
  ├─ organization_members (роль в организации)
  │   └─ Organization
  │       └─ Workspaces
  │           └─ workspace_members (роль в воркспейсе)
  └─ workspace_members (прямой доступ к воркспейсу)
```

### Принципы доступа

1. **Доступ к организации** → автоматический доступ ко всем воркспейсам
2. **Роль в организации** определяет максимальные права в воркспейсах
3. **Роль в воркспейсе** может быть ниже роли в организации
4. **Каскадное удаление**: Organization → Workspaces → Members

## Components and Interfaces

### Database Schema

#### 1. Organizations Table

```typescript
// packages/db/src/schema/organization/organization.ts
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organization = pgTable("organizations", {
  id: text("id").primaryKey().default(sql`organization_id_generate()`),
  
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  website: text("website"),
  logo: text("logo"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
```

#### 2. Organization Members Table

```typescript
// packages/db/src/schema/organization/organization-member.ts
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const organizationRoleEnum = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoleEnum)[number];

export const organizationMember = pgTable(
  "organization_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    
    role: text("role", { enum: organizationRoleEnum })
      .default("member")
      .notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
  }),
);
```

#### 3. Organization Invites Table

```typescript
// packages/db/src/schema/organization/organization-invite.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organizationInvite = pgTable("organization_invites", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  
  token: text("token").notNull().unique(),
  role: text("role", { enum: organizationRoleEnum }).notNull(),
  
  invitedEmail: text("invited_email"),
  invitedUserId: text("invited_user_id").references(() => user.id, { 
    onDelete: "cascade" 
  }),
  
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### 4. Updated Workspaces Table

```typescript
// packages/db/src/schema/workspace/workspace.ts
export const workspace = pgTable("workspaces", {
  id: text("id").primaryKey().default(sql`workspace_id_generate()`),
  
  // НОВОЕ ПОЛЕ
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  website: text("website"),
  logo: text("logo"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
}, (table) => ({
  // Уникальность slug в рамках организации
  uniqueSlugPerOrg: unique().on(table.organizationId, table.slug),
}));
```

#### 5. Database Functions

```sql
-- packages/db/src/scripts/organization-id-generate.sql
CREATE OR REPLACE FUNCTION organization_id_generate()
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  new_id := 'org_' || encode(gen_random_uuid()::bytea, 'base64');
  new_id := replace(new_id, '/', '_');
  new_id := replace(new_id, '+', '-');
  new_id := rtrim(new_id, '=');
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
```

### Relations

```typescript
// packages/db/src/schema/organization/relations.ts
import { relations } from "drizzle-orm";
import { organization, organizationMember, organizationInvite } from "./";
import { user } from "../auth/user";
import { workspace } from "../workspace/workspace";

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(organizationMember),
  workspaces: many(workspace),
  invites: many(organizationInvite),
}));

export const organizationMemberRelations = relations(
  organizationMember,
  ({ one }) => ({
    user: one(user, {
      fields: [organizationMember.userId],
      references: [user.id],
    }),
    organization: one(organization, {
      fields: [organizationMember.organizationId],
      references: [organization.id],
    }),
  }),
);

export const organizationInviteRelations = relations(
  organizationInvite,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationInvite.organizationId],
      references: [organization.id],
    }),
    invitedUser: one(user, {
      fields: [organizationInvite.invitedUserId],
      references: [user.id],
    }),
    creator: one(user, {
      fields: [organizationInvite.createdBy],
      references: [user.id],
    }),
  }),
);
```

## Data Models

### TypeScript Types

```typescript
// packages/db/src/schema/organization/types.ts
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type OrganizationMember = typeof organizationMember.$inferSelect;
export type NewOrganizationMember = typeof organizationMember.$inferInsert;

export type OrganizationInvite = typeof organizationInvite.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvite.$inferInsert;

// Расширенные типы с relations
export type OrganizationWithMembers = Organization & {
  members: (OrganizationMember & { user: User })[];
};

export type OrganizationWithWorkspaces = Organization & {
  workspaces: Workspace[];
};

export type OrganizationFull = Organization & {
  members: (OrganizationMember & { user: User })[];
  workspaces: Workspace[];
};
```

### Zod Validators

```typescript
// packages/validators/src/organization.ts
import { z } from "zod/v4";

export const createOrganizationSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug может содержать только строчные буквы, цифры и дефисы"),
  description: z.string().max(500).optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
});

export const updateOrganizationSchema = createOrganizationSchema.partial();

export const inviteToOrganizationSchema = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member"]),
});

export const updateMemberRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["owner", "admin", "member"]),
});
```

## Repository Layer

```typescript
// packages/db/src/repositories/organization.repository.ts
export class OrganizationRepository {
  // CRUD операции
  async create(data: NewOrganization): Promise<Organization>
  async findById(id: string): Promise<OrganizationFull | null>
  async findBySlug(slug: string): Promise<Organization | null>
  async update(id: string, data: Partial<Organization>): Promise<Organization>
  async delete(id: string): Promise<void>
  
  // Участники
  async addMember(orgId: string, userId: string, role: OrganizationRole)
  async removeMember(orgId: string, userId: string): Promise<void>
  async updateMemberRole(orgId: string, userId: string, role: OrganizationRole)
  async getMembers(orgId: string): Promise<(OrganizationMember & { user: User })[]>
  async checkAccess(orgId: string, userId: string): Promise<OrganizationMember | null>
  async getUserOrganizations(userId: string): Promise<Organization[]>
  
  // Приглашения
  async createInvite(data: NewOrganizationInvite): Promise<OrganizationInvite>
  async getInviteByToken(token: string): Promise<OrganizationInvite | null>
  async getPendingInvites(orgId: string): Promise<OrganizationInvite[]>
  async deleteInvite(inviteId: string): Promise<void>
  
  // Воркспейсы
  async getWorkspaces(orgId: string): Promise<Workspace[]>
  async getWorkspaceBySlug(orgId: string, slug: string): Promise<Workspace | null>
}
```

## API Endpoints

### Organization Management

```typescript
// POST /api/organizations
// Создать организацию
{
  name: string;
  slug: string;
  description?: string;
  website?: string;
  logo?: string;
}

// GET /api/organizations
// Получить все организации пользователя
Response: Organization[]

// GET /api/organizations/:orgId
// Получить организацию по ID
Response: OrganizationFull

// PATCH /api/organizations/:orgId
// Обновить организацию
{
  name?: string;
  slug?: string;
  description?: string;
  website?: string;
  logo?: string;
}

// DELETE /api/organizations/:orgId
// Удалить организацию
```

### Organization Members

```typescript
// GET /api/organizations/:orgId/members
// Получить всех участников
Response: (OrganizationMember & { user: User })[]

// POST /api/organizations/:orgId/members
// Добавить участника
{
  userId: string;
  role: "owner" | "admin" | "member";
}

// PATCH /api/organizations/:orgId/members/:userId
// Обновить роль участника
{
  role: "owner" | "admin" | "member";
}

// DELETE /api/organizations/:orgId/members/:userId
// Удалить участника
```

### Organization Invites

```typescript
// POST /api/organizations/:orgId/invites
// Создать приглашение
{
  email: string;
  role: "owner" | "admin" | "member";
}

// GET /api/organizations/:orgId/invites
// Получить все приглашения
Response: OrganizationInvite[]

// POST /api/invites/:token/accept
// Принять приглашение
Response: { organization: Organization; member: OrganizationMember }

// DELETE /api/organizations/:orgId/invites/:inviteId
// Отменить приглашение
```

### Workspaces (обновленные)

```typescript
// POST /api/organizations/:orgId/workspaces
// Создать воркспейс в организации
{
  name: string;
  slug: string;
  description?: string;
}

// GET /api/organizations/:orgId/workspaces
// Получить все воркспейсы организации
Response: Workspace[]

// GET /api/organizations/:orgId/workspaces/:workspaceSlug
// Получить воркспейс по slug
Response: Workspace
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

После анализа всех acceptance criteria, выявлены следующие группы свойств:

1. **Создание и структура организации** (1.1-2.3): Можно объединить в одно свойство о корректном создании
2. **Уникальность slug** (1.5, 2.4): Дубликат - оставляем одно свойство
3. **Связь воркспейсов с организацией** (3.1-3.3): Объединяем в свойство об инварианте связи
4. **Управление участниками** (4.3-4.6): Отдельные свойства для каждого правила
5. **Права доступа** (5.1-5.4): Объединяем в одно свойство о проверке прав
6. **Приглашения** (8.1-8.6): Отдельные свойства для создания, валидации и принятия
7. **Валидация входных данных** (10.1-10.3): Объединяем в одно свойство о валидации

### Properties

**Property 1: Organization Creation Completeness**

*For any* user registration, creating an organization SHALL result in:

- Organization with ID starting with `org_`
- Unique slug generated from name
- User assigned as owner in organization
- Default workspace created within organization
- User assigned as owner in default workspace

**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.3**

---

**Property 2: Organization Slug Uniqueness**

*For any* two organizations, their slugs SHALL be unique across the entire system, and attempting to create an organization with an existing slug SHALL be rejected.

**Validates: Requirements 1.5, 2.4**

---

**Property 3: Workspace-Organization Relationship Invariant**

*For any* workspace in the system:

- It SHALL have exactly one organizationId (not null)
- The organizationId SHALL reference an existing organization
- When the organization is deleted, the workspace SHALL be cascade deleted

**Validates: Requirements 3.1, 3.2, 3.3**

**Property 4: Member Role Assignment**

*For any* user added to an organization without explicit role specification, the system SHALL assign the default "member" role.

**Validates: Requirements 4.3**

---

**Property 5: Multiple Owners Allowed**

*For any* organization, the system SHALL allow adding multiple users with "owner" role, and all SHALL have equal permissions.

**Validates: Requirements 4.4**

---

**Property 6: Last Owner Protection**

*For any* organization with exactly one owner, attempting to remove that owner SHALL be rejected by the system.

**Validates: Requirements 4.5**

---

**Property 7: Cascade Member Removal**

*For any* user removed from an organization, the system SHALL automatically remove them from all workspaces within that organization.

**Validates: Requirements 4.6**

---

**Property 8: Role-Based Access Control**

*For any* user attempting an action on an organization:

- Owner role SHALL allow all management actions
- Admin role SHALL allow managing members (except owners) and workspaces
- Member role SHALL allow only viewing and accessing assigned workspaces
- Non-members SHALL be denied all access

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

---

**Property 9: URL Pattern Validation**

*For any* workspace access request, the URL SHALL match pattern `/orgs/[orgSlug]/workspaces/[workspaceSlug]` where both slugs exist and the workspace belongs to the specified organization.

**Validates: Requirements 6.1, 6.2**

---

**Property 10: Invitation Creation and Uniqueness**

*For any* admin creating an invitation:

- System SHALL create organization_invites record with unique token
- Token SHALL have expiration date
- Duplicate invitations to same email for same organization SHALL be rejected

**Validates: Requirements 8.1, 8.2, 8.6**

**Property 11: Invitation Acceptance**

*For any* valid invitation token, when a user accepts it, the system SHALL:

- Validate token exists and is not expired
- Add user to organization with specified role
- Delete the invitation record

**Validates: Requirements 8.4, 8.5**

---

**Property 12: Input Validation**

*For any* organization creation or update:

- Name SHALL not be empty and SHALL have maximum 100 characters
- Slug SHALL match pattern `^[a-z0-9-]+$`
- Slug length SHALL be between 3 and 50 characters
- Invalid inputs SHALL be rejected with appropriate error messages

**Validates: Requirements 10.1, 10.2, 10.3**

---

## Error Handling

### Error Types

```typescript
export class OrganizationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "OrganizationError";
  }
}

export const OrganizationErrorCodes = {
  NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  SLUG_TAKEN: "ORGANIZATION_SLUG_TAKEN",
  UNAUTHORIZED: "ORGANIZATION_UNAUTHORIZED",
  LAST_OWNER: "CANNOT_REMOVE_LAST_OWNER",
  INVALID_SLUG: "INVALID_SLUG_FORMAT",
  INVALID_NAME: "INVALID_NAME",
  INVITE_EXPIRED: "INVITATION_EXPIRED",
  INVITE_NOT_FOUND: "INVITATION_NOT_FOUND",
  DUPLICATE_INVITE: "DUPLICATE_INVITATION",
  WORKSPACE_NOT_IN_ORG: "WORKSPACE_NOT_IN_ORGANIZATION",
} as const;
```

### Error Handling Strategy

1. **Validation Errors**: Возвращать 400 с детальным описанием
2. **Authorization Errors**: Возвращать 403 с минимальной информацией
3. **Not Found Errors**: Возвращать 404
4. **Database Errors**: Логировать и возвращать 500 с общим сообщением
5. **Cascade Failures**: Использовать транзакции для атомарности

## Testing Strategy

### Dual Testing Approach

Мы будем использовать комбинацию unit-тестов и property-based тестов:

- **Unit tests**: Проверяют конкретные примеры, edge cases и error conditions
- **Property tests**: Проверяют универсальные свойства на множестве сгенерированных входных данных

### Property-Based Testing

Используем библиотеку **fast-check** для TypeScript.

Каждый property test должен:

- Запускаться минимум 100 итераций
- Иметь комментарий с ссылкой на property из design.md
- Генерировать случайные, но валидные входные данные

Пример:

```typescript
// Feature: organization-entity, Property 1: Organization Creation Completeness
test("organization creation creates complete structure", async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.emailAddress(),
      }),
      async ({ name, email }) => {
        const user = await createTestUser(email);
        const org = await createOrganization(user.id, name);
        
        // Проверяем все аспекты Property 1
        expect(org.id).toMatch(/^org_/);
        expect(org.slug).toBeTruthy();
        
        const member = await getOrganizationMember(org.id, user.id);
        expect(member?.role).toBe("owner");
        
        const workspaces = await getOrganizationWorkspaces(org.id);
        expect(workspaces.length).toBeGreaterThan(0);
        
        const workspaceMember = await getWorkspaceMember(
          workspaces[0].id,
          user.id
        );
        expect(workspaceMember?.role).toBe("owner");
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Testing Focus

Unit tests должны покрывать:

1. **Конкретные примеры**:
   - Создание организации с валидными данными
   - Обновление организации
   - Добавление/удаление участников

2. **Edge cases**:
   - Пустые строки
   - Максимальные длины
   - Специальные символы в slug
   - Граничные значения дат

3. **Error conditions**:
   - Дублирующиеся slug
   - Несуществующие ID
   - Недостаточные права
   - Просроченные приглашения

4. **Integration points**:
   - Взаимодействие с auth системой
   - Email отправка для приглашений
   - Каскадное удаление

### Test Organization

```
packages/db/src/repositories/__tests__/
  ├── organization.repository.test.ts (unit tests)
  └── organization.repository.properties.test.ts (property tests)

packages/api/src/routes/__tests__/
  ├── organizations.test.ts (API unit tests)
  └── organizations.properties.test.ts (API property tests)
```

## UI Components

### Organization Switcher

```typescript
// apps/app/components/organization-switcher.tsx
interface OrganizationSwitcherProps {
  currentOrg: Organization;
  organizations: Organization[];
  onSwitch: (orgSlug: string) => void;
}

// Shadcn UI компоненты:
// - DropdownMenu для списка организаций
// - Avatar для логотипов
// - Badge для текущей организации
```

### Organization Settings

```typescript
// apps/app/app/orgs/[orgSlug]/settings/page.tsx
// Разделы:
// - General (name, slug, description, website, logo)
// - Members (список участников с ролями)
// - Invitations (активные приглашения)
// - Danger Zone (удаление организации)
```

### Member Management

```typescript
// apps/app/components/organization-members.tsx
// Функции:
// - Список участников с аватарами и ролями
// - Изменение ролей (dropdown)
// - Удаление участников (с подтверждением)
// - Приглашение новых участников (dialog)
```

### Workspace List

```typescript
// apps/app/app/orgs/[orgSlug]/workspaces/page.tsx
// Отображение:
// - Grid/List view воркспейсов
// - Кнопка создания нового воркспейса
// - Поиск и фильтрация
// - Быстрый доступ к последним воркспейсам
```

## Migration Strategy

### Phase 1: Schema Changes

1. Создать таблицы `organizations`, `organization_members`, `organization_invites`
2. Добавить функцию `organization_id_generate()`
3. Добавить поле `organizationId` в таблицу `workspaces` (nullable на время миграции)

### Phase 2: Data Migration

```typescript
// packages/db/src/scripts/migrate-to-organizations.ts
async function migrateToOrganizations() {
  // 1. Для каждого workspace owner создать организацию
  const owners = await getWorkspaceOwners();
  
  for (const owner of owners) {
    const org = await createOrganization({
      name: `${owner.name}'s Organization`,
      slug: generateSlug(owner.name),
    });
    
    // 2. Добавить owner в organization_members
    await addOrganizationMember(org.id, owner.userId, "owner");
    
    // 3. Связать все воркспейсы owner с организацией
    await updateWorkspacesOrganization(owner.userId, org.id);
    
    // 4. Мигрировать workspace members в organization members
    await migrateWorkspaceMembers(owner.userId, org.id);
  }
  
  // 5. Сделать organizationId NOT NULL
  await makeOrganizationIdRequired();
}
```

### Phase 3: Code Updates

1. Обновить все API endpoints для работы с организациями
2. Обновить UI для новой URL структуры
3. Добавить редиректы со старых URL на новые
4. Обновить middleware для проверки доступа к организациям

### Phase 4: Cleanup

1. Удалить старые редиректы через 3 месяца
2. Удалить deprecated API endpoints
3. Обновить документацию
