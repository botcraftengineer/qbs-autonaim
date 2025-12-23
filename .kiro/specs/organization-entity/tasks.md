# Implementation Plan: Сущность Организация

## Overview

Реализация системы организаций будет выполнена в 4 фазы:

1. Database Schema & Functions
2. Repository Layer & Validators
3. API Endpoints
4. UI Components & Migration

Каждая фаза включает основную реализацию и тесты. Тесты помечены как опциональные (*) для ускорения MVP.

## Tasks

- [-] 1. Database Schema Setup
  - [x] 1.1 Создать SQL функцию для генерации organization ID
    - Создать файл `packages/db/src/scripts/organization-id-generate.sql`
    - Функция должна генерировать ID с префиксом `org_`
    - Использовать тот же формат что и `workspace_id_generate()`
    - _Requirements: 2.3_
  
  - [x] 1.2 Создать схему organizations
    - Создать `packages/db/src/schema/organization/organization.ts`
    - Поля: id, name, slug, description, website, logo, timestamps
    - Использовать `organization_id_generate()` для ID
    - Уникальный constraint на slug
    - _Requirements: 2.1, 2.2, 2.4_
  
  - [x] 1.3 Создать схему organization_members
    - Создать `packages/db/src/schema/organization/organization-member.ts`
    - Composite primary key (userId, organizationId)
    - Enum для ролей: owner, admin, member
    - Foreign keys с cascade delete
    - _Requirements: 4.1, 4.2_
  
  - [x] 1.4 Создать схему organization_invites
    - Создать `packages/db/src/schema/organization/organization-invite.ts`
    - Поля: id, organizationId, token, role, invitedEmail, invitedUserId, createdBy, expiresAt
    - Уникальный constraint на token
    - _Requirements: 8.1, 8.2_

  - [x] 1.5 Обновить схему workspaces
    - Добавить поле `organizationId` в `packages/db/src/schema/workspace/workspace.ts`
    - Сделать поле nullable на время миграции
    - Добавить foreign key с cascade delete
    - Добавить unique constraint на (organizationId, slug)
    - _Requirements: 3.1, 3.2_
  
  - [x] 1.6 Создать relations для организаций
    - Создать `packages/db/src/schema/organization/relations.ts`
    - Определить relations: organization ↔ members, workspaces, invites
    - Экспортировать все relations
    - _Requirements: 3.3_
  
  - [x] 1.7 Обновить schema index
    - Добавить export в `packages/db/src/schema/organization/index.ts`
    - Добавить export в `packages/db/src/schema/index.ts`
    - _Requirements: 2.1_

- [ ]* 1.8 Написать property test для структуры организации
  - **Property 1: Organization Creation Completeness**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 2.3**

- [ ]* 1.9 Написать property test для уникальности slug
  - **Property 2: Organization Slug Uniqueness**
  - **Validates: Requirements 1.5, 2.4**

- [x] 2. Repository Layer
  - [x] 2.1 Создать OrganizationRepository
    - Создать `packages/db/src/repositories/organization.repository.ts`
    - Реализовать CRUD методы: create, findById, findBySlug, update, delete
    - Реализовать методы для участников: addMember, removeMember, updateMemberRole, getMembers
    - Реализовать checkAccess для проверки прав доступа
    - _Requirements: 4.3, 4.4, 4.5, 5.4_
  
  - [x] 2.2 Добавить методы для приглашений в OrganizationRepository
    - Методы: createInvite, getInviteByToken, getPendingInvites, deleteInvite
    - Генерация уникального токена с помощью nanoid
    - Проверка дубликатов приглашений
    - _Requirements: 8.1, 8.2, 8.6_
  
  - [x] 2.3 Добавить методы для воркспейсов в OrganizationRepository
    - Методы: getWorkspaces, getWorkspaceBySlug
    - Валидация связи workspace ↔ organization
    - _Requirements: 3.3, 6.2_
  
  - [x] 2.4 Обновить WorkspaceRepository
    - Добавить параметр organizationId в метод create
    - Обновить методы для работы с organizationId
    - Добавить валидацию organizationId при создании
    - _Requirements: 3.1, 3.5_

- [ ]* 2.5 Написать unit tests для OrganizationRepository
  - Тесты для CRUD операций
  - Тесты для управления участниками
  - Тесты для edge cases (пустые значения, несуществующие ID)
  - _Requirements: 4.3, 4.4, 4.5_

- [ ]* 2.6 Написать property test для защиты последнего owner
  - **Property 6: Last Owner Protection**
  - **Validates: Requirements 4.5**

- [ ]* 2.7 Написать property test для каскадного удаления участника
  - **Property 7: Cascade Member Removal**
  - **Validates: Requirements 4.6**

- [x] 3. Validators
  - [x] 3.1 Создать Zod схемы для организаций
    - Создать `packages/validators/src/organization.ts`
    - Схемы: createOrganizationSchema, updateOrganizationSchema
    - Валидация name (1-100 символов)
    - Валидация slug (3-50 символов, только lowercase, цифры, дефисы)
    - Валидация website (URL format)
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 3.2 Создать Zod схемы для приглашений
    - Схемы: inviteToOrganizationSchema, updateMemberRoleSchema
    - Валидация email
    - Валидация role enum
    - _Requirements: 8.1_
  
  - [x] 3.3 Экспортировать validators
    - Добавить exports в `packages/validators/src/index.ts`
    - _Requirements: 10.1_

- [ ]* 3.4 Написать property test для валидации входных данных
  - **Property 12: Input Validation**
  - **Validates: Requirements 10.1, 10.2, 10.3**

- [x] 4. Checkpoint - Database & Repository Layer Complete
  - [x] Убедиться что все схемы созданы и экспортированы
  - [x] Убедиться что repository методы работают корректно
  - [x] Спросить пользователя если возникли вопросы

- [x] 5. API Endpoints - Organization Management
  - [x] 5.1 Создать POST /api/organizations
    - Создать `packages/api/src/routes/organizations/create.ts`
    - Валидация с помощью createOrganizationSchema
    - Проверка уникальности slug
    - Автоматическое добавление создателя как owner
    - _Requirements: 1.1, 1.5_
  
  - [x] 5.2 Создать GET /api/organizations
    - Создать `packages/api/src/routes/organizations/list.ts`
    - Получение всех организаций текущего пользователя
    - Включить информацию о роли пользователя
    - _Requirements: 9.1_
  
  - [x] 5.3 Создать GET /api/organizations/:orgId
    - Создать `packages/api/src/routes/organizations/get.ts`
    - Проверка доступа пользователя к организации
    - Включить members и workspaces
    - _Requirements: 5.4_
  
  - [x] 5.4 Создать PATCH /api/organizations/:orgId
    - Создать `packages/api/src/routes/organizations/update.ts`
    - Проверка прав (только owner/admin)
    - Валидация с помощью updateOrganizationSchema
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.5 Создать DELETE /api/organizations/:orgId
    - Создать `packages/api/src/routes/organizations/delete.ts`
    - Проверка прав (только owner)
    - Каскадное удаление workspaces и members
    - _Requirements: 3.2, 5.1_

- [ ]* 5.6 Написать property test для role-based access control
  - **Property 8: Role-Based Access Control**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

- [x] 6. API Endpoints - Organization Members
  - [x] 6.1 Создать GET /api/organizations/:orgId/members
    - Создать `packages/api/src/routes/organizations/members/list.ts`
    - Проверка доступа к организации
    - Возврат списка участников с user данными
    - _Requirements: 4.7_
  
  - [x] 6.2 Создать POST /api/organizations/:orgId/members
    - Создать `packages/api/src/routes/organizations/members/add.ts`
    - Проверка прав (owner/admin)
    - Добавление участника с указанной ролью
    - _Requirements: 4.3, 5.2_

  - [x] 6.3 Создать PATCH /api/organizations/:orgId/members/:userId
    - Создать `packages/api/src/routes/organizations/members/update-role.ts`
    - Проверка прав (owner может менять всех, admin - кроме owner)
    - Обновление роли участника
    - _Requirements: 5.1, 5.2_
  
  - [x] 6.4 Создать DELETE /api/organizations/:orgId/members/:userId
    - Создать `packages/api/src/routes/organizations/members/remove.ts`
    - Проверка защиты последнего owner
    - Каскадное удаление из всех workspaces организации
    - _Requirements: 4.5, 4.6_

- [x] 7. API Endpoints - Organization Invites
  - [x] 7.1 Создать POST /api/organizations/:orgId/invites
    - Создать `packages/api/src/routes/organizations/invites/create.ts`
    - Проверка прав (owner/admin)
    - Генерация уникального токена
    - Проверка дубликатов по email
    - Отправка email уведомления
    - _Requirements: 8.1, 8.2, 8.3, 8.6_
  
  - [x] 7.2 Создать GET /api/organizations/:orgId/invites
    - Создать `packages/api/src/routes/organizations/invites/list.ts`
    - Проверка прав (owner/admin)
    - Возврат только активных приглашений
    - _Requirements: 8.1_
  
  - [x] 7.3 Создать POST /api/invites/:token/accept
    - Создать `packages/api/src/routes/invites/accept.ts`
    - Валидация токена и срока действия
    - Добавление пользователя в организацию
    - Удаление приглашения после принятия
    - _Requirements: 8.4, 8.5_
  
  - [x] 7.4 Создать DELETE /api/organizations/:orgId/invites/:inviteId
    - Создать `packages/api/src/routes/organizations/invites/delete.ts`
    - Проверка прав (owner/admin)
    - Отмена приглашения
    - _Requirements: 8.7_

- [ ]* 7.5 Написать property test для приглашений
  - **Property 10: Invitation Creation and Uniqueness**
  - **Property 11: Invitation Acceptance**
  - **Validates: Requirements 8.1, 8.2, 8.4, 8.5, 8.6**

- [x] 8. API Endpoints - Workspaces (обновленные)
  - [x] 8.1 Обновить POST /api/workspaces
    - Изменить на POST /api/organizations/:orgId/workspaces
    - Добавить параметр organizationId
    - Проверка доступа к организации
    - Уникальность slug в рамках организации
    - _Requirements: 3.1, 6.1_
  
  - [x] 8.2 Создать GET /api/organizations/:orgId/workspaces
    - Получение всех workspaces организации
    - Проверка доступа к организации
    - _Requirements: 3.4_
  
  - [x] 8.3 Создать GET /api/organizations/:orgId/workspaces/:workspaceSlug
    - Получение workspace по slug
    - Валидация что workspace принадлежит организации
    - _Requirements: 6.2_

- [ ]* 8.4 Написать property test для URL pattern validation
  - **Property 9: URL Pattern Validation**
  - **Validates: Requirements 6.1, 6.2**

- [x] 9. Checkpoint - API Layer Complete
  - [x] Убедиться что все endpoints работают
  - [x] Проверить авторизацию и валидацию
  - [x] Спросить пользователя если возникли вопросы

- [x] 10. UI Components - Organization Switcher
  - [x] 10.1 Создать OrganizationSwitcher компонент
    - Создать `apps/app/components/organization-switcher.tsx`
    - Использовать Shadcn DropdownMenu
    - Отображение списка организаций пользователя
    - Текущая организация с Badge
    - Переключение между организациями
    - _Requirements: 9.1, 9.2, 9.4_
  
  - [x] 10.2 Интегрировать OrganizationSwitcher в навигацию
    - Добавить в главную навигацию приложения
    - Показывать текущую организацию
    - _Requirements: 9.4_

- [-] 11. UI Components - Organization Settings
  - [x] 11.1 Создать страницу General Settings
    - Создать `apps/app/app/orgs/[orgSlug]/settings/page.tsx`
    - Форма редактирования: name, slug, description, website, logo
    - Валидация на клиенте с помощью Zod
    - Оптимистичные обновления
    - _Requirements: 2.6_

  - [x] 11.2 Создать страницу Members Management
    - Создать `apps/app/app/orgs/[orgSlug]/settings/members/page.tsx`
    - Таблица участников с аватарами, именами, ролями
    - Dropdown для изменения ролей (с проверкой прав)
    - Кнопка удаления участника (с подтверждением)
    - Защита от удаления последнего owner
    - _Requirements: 4.5, 5.1, 5.2_
  
  - [ ] 11.3 Создать компонент InviteMemberDialog
    - Создать `apps/app/components/invite-member-dialog.tsx`
    - Форма с полями: email, role
    - Валидация email
    - Отображение ошибки при дубликате
    - _Requirements: 8.1, 8.6_
  
  - [ ] 11.4 Создать страницу Invitations
    - Создать `apps/app/app/orgs/[orgSlug]/settings/invitations/page.tsx`
    - Список активных приглашений
    - Кнопка отмены приглашения
    - Отображение срока действия
    - _Requirements: 8.1_
  
  - [ ] 11.5 Создать страницу Danger Zone
    - Добавить секцию в settings для удаления организации
    - Подтверждение с вводом названия организации
    - Предупреждение о каскадном удалении
    - _Requirements: 3.2_

- [ ] 12. UI Components - Workspace List
  - [ ] 12.1 Создать страницу списка workspaces
    - Создать `apps/app/app/orgs/[orgSlug]/workspaces/page.tsx`
    - Grid view с карточками workspaces
    - Кнопка создания нового workspace
    - Поиск и фильтрация
    - _Requirements: 3.4, 6.1_
  
  - [ ] 12.2 Создать CreateWorkspaceDialog
    - Создать `apps/app/components/create-workspace-dialog.tsx`
    - Форма с полями: name, slug, description
    - Валидация уникальности slug в рамках организации
    - _Requirements: 3.1_
  
  - [ ] 12.3 Обновить workspace страницы для новой URL структуры
    - Изменить пути с `/workspaces/[slug]` на `/orgs/[orgSlug]/workspaces/[slug]`
    - Обновить все ссылки и навигацию
    - _Requirements: 6.1_

- [ ] 13. Registration Flow Update
  - [ ] 13.1 Обновить процесс регистрации
    - Изменить `apps/app/app/auth/register/page.tsx`
    - После создания пользователя создавать организацию
    - Создавать default workspace в организации
    - Добавлять пользователя как owner в оба
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ] 13.2 Обновить редирект после регистрации
    - Редиректить на `/orgs/[orgSlug]/workspaces/[workspaceSlug]`
    - Сохранять последнюю посещенную организацию в cookies/localStorage
    - _Requirements: 1.6, 9.3_

- [ ] 14. Middleware & Authorization
  - [ ] 14.1 Создать middleware для проверки доступа к организации
    - Создать `apps/app/middleware/organization-access.ts`
    - Проверять членство в организации перед доступом к ресурсам
    - Возвращать 403 если доступ запрещен
    - _Requirements: 5.4, 5.5_
  
  - [ ] 14.2 Создать middleware для проверки доступа к workspace
    - Обновить существующий workspace middleware
    - Добавить проверку что workspace принадлежит организации из URL
    - Проверять доступ к организации перед доступом к workspace
    - _Requirements: 6.2, 6.3_
  
  - [ ] 14.3 Создать хелперы для проверки прав
    - Создать `packages/lib/src/permissions/organization.ts`
    - Функции: canManageOrganization, canManageMembers, canInviteMembers
    - Использовать в API endpoints и UI
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 15. Checkpoint - UI & Auth Complete
  - Убедиться что все UI компоненты работают
  - Проверить авторизацию и редиректы
  - Протестировать регистрацию нового пользователя
  - Спросить пользователя если возникли вопросы

- [ ] 16. Data Migration
  - [ ] 16.1 Создать скрипт миграции
    - Создать `packages/db/src/scripts/migrate-to-organizations.ts`
    - Для каждого workspace owner создать организацию
    - Связать workspaces с организациями
    - Мигрировать workspace members в organization members
    - Логировать прогресс и ошибки
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 16.2 Создать rollback скрипт
    - Создать `packages/db/src/scripts/rollback-organizations.ts`
    - Возможность отката миграции в случае проблем
    - Восстановление старой структуры
    - _Requirements: 7.6_
  
  - [ ] 16.3 Выполнить миграцию на staging
    - Запустить миграцию на тестовом окружении
    - Проверить корректность данных
    - Протестировать все функции
    - _Requirements: 7.1-7.6_
  
  - [ ] 16.4 Сделать organizationId NOT NULL
    - После успешной миграции обновить схему
    - Сделать поле organizationId обязательным
    - _Requirements: 3.1_

- [ ] 17. URL Redirects
  - [ ] 17.1 Создать редиректы со старых URL
    - Создать `apps/app/middleware/legacy-redirects.ts`
    - Редиректить `/workspaces/[slug]` → `/orgs/[orgSlug]/workspaces/[slug]`
    - Определять orgSlug на основе workspace
    - _Requirements: 6.6_
  
  - [ ] 17.2 Обновить все внутренние ссылки
    - Найти и заменить все ссылки на workspaces
    - Обновить навигацию
    - Обновить breadcrumbs
    - _Requirements: 6.1_

- [ ] 18. Email Templates
  - [ ] 18.1 Создать email template для приглашения в организацию
    - Создать `packages/emails/templates/organization-invite.tsx`
    - Использовать React Email
    - Включить название организации, роль, ссылку для принятия
    - _Requirements: 8.3_
  
  - [ ] 18.2 Интегрировать отправку email
    - Обновить API endpoint создания приглашения
    - Отправлять email после создания приглашения
    - Обрабатывать ошибки отправки
    - _Requirements: 8.3_

- [ ]* 19. Integration Tests
  - [ ]* 19.1 Написать integration tests для полного flow
    - Тест: регистрация → создание организации → создание workspace
    - Тест: приглашение участника → принятие → доступ к workspaces
    - Тест: удаление организации → каскадное удаление
    - _Requirements: 1.1-1.6, 8.1-8.5, 3.2_
  
  - [ ]* 19.2 Написать E2E tests для UI
    - Тест: переключение между организациями
    - Тест: управление участниками
    - Тест: создание и удаление workspaces
    - _Requirements: 9.1-9.5_

- [ ] 20. Documentation & Cleanup
  - [ ] 20.1 Обновить API документацию
    - Документировать все новые endpoints
    - Примеры запросов и ответов
    - Описание ошибок
  
  - [ ] 20.2 Обновить README
    - Описать новую структуру с организациями
    - Инструкции по миграции
    - Примеры использования
  
  - [ ] 20.3 Удалить deprecated код
    - Удалить старые редиректы (через 3 месяца)
    - Удалить неиспользуемые API endpoints
    - Очистить комментарии и TODO

- [ ] 21. Final Checkpoint
  - Запустить все тесты (unit + property + integration)
  - Проверить производительность на больших данных
  - Провести security audit
  - Получить approval от пользователя для деплоя

## Notes

- Задачи помеченные `*` являются опциональными и могут быть пропущены для ускорения MVP
- Каждая задача ссылается на конкретные requirements для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- Миграция данных выполняется после завершения основной разработки
