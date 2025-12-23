# Requirements Document: Сущность Организация

## Introduction

Данная спецификация описывает внедрение сущности "Организация" (Organization) в систему. Организация будет верхним уровнем иерархии, содержащим воркспейсы и участников с ролями. Это позволит группировать воркспейсы под единой организацией и управлять доступом на уровне организации.

## Glossary

- **Organization (Организация)**: Верхнеуровневая сущность, объединяющая воркспейсы и участников
- **Workspace (Воркспейс)**: Рабочее пространство, принадлежащее организации
- **Organization_Member (Участник организации)**: Пользователь с определенной ролью в организации
- **Organization_Role (Роль в организации)**: Уровень доступа участника в организации (owner, admin, member)
- **Slug**: Уникальный URL-идентификатор для организации
- **System**: Система управления организациями и воркспейсами

## Requirements

### Requirement 1: Создание организации

**User Story:** As a user, I want to create an organization during registration, so that I can manage multiple workspaces under one entity.

#### Acceptance Criteria

1. WHEN a user completes registration, THE System SHALL automatically create a new Organization with the user as owner
2. THE System SHALL generate a unique slug for the Organization based on the organization name
3. THE System SHALL create a default workspace within the newly created Organization
4. THE System SHALL assign the user as owner role in both the Organization and the default workspace
5. WHEN an Organization is created, THE System SHALL validate that the slug is unique across all organizations
6. THE System SHALL redirect the user to `/orgs/[orgSlug]/workspaces/[workspaceSlug]` after successful creation

### Requirement 2: Структура данных организации

**User Story:** As a system architect, I want a well-defined organization data structure, so that the system can efficiently manage organizations and their relationships.

#### Acceptance Criteria

1. THE Organization SHALL have the following required fields: id, name, slug, createdAt, updatedAt
2. THE Organization SHALL have the following optional fields: description, website, logo
3. THE System SHALL generate Organization id with prefix `org_` using the same format as workspace ids
4. THE System SHALL enforce unique constraint on Organization slug
5. THE System SHALL maintain timestamps (createdAt, updatedAt) automatically
6. WHEN Organization name is updated, THE System SHALL optionally regenerate the slug if requested

### Requirement 3: Связь организации с воркспейсами

**User Story:** As a system architect, I want workspaces to belong to organizations, so that we can maintain proper hierarchy and access control.

#### Acceptance Criteria

1. THE Workspace SHALL have a required organizationId foreign key field
2. WHEN an Organization is deleted, THE System SHALL cascade delete all associated Workspaces
3. THE System SHALL enforce that every Workspace belongs to exactly one Organization
4. THE System SHALL allow querying all Workspaces belonging to an Organization
5. THE System SHALL validate organizationId exists before creating a Workspace

### Requirement 4: Участники организации и роли

**User Story:** As an organization owner, I want to manage organization members with different roles, so that I can control access levels within my organization.

#### Acceptance Criteria

1. THE System SHALL support three organization roles: owner, admin, member
2. THE System SHALL create an organization_members junction table linking users to organizations
3. WHEN a user is added to an Organization, THE System SHALL assign a role (default: member)
4. THE System SHALL allow multiple owners per Organization
5. THE System SHALL prevent removing the last owner from an Organization
6. WHEN a user is removed from an Organization, THE System SHALL also remove them from all Workspaces within that Organization
7. THE System SHALL enforce unique constraint on (userId, organizationId) pair

### Requirement 5: Права доступа по ролям

**User Story:** As an organization admin, I want role-based permissions, so that I can control what actions members can perform.

#### Acceptance Criteria

1. WHEN a user has owner role, THE System SHALL allow all organization management actions
2. WHEN a user has admin role, THE System SHALL allow managing members (except owners) and workspaces
3. WHEN a user has member role, THE System SHALL allow only viewing organization and accessing assigned workspaces
4. THE System SHALL check organization membership before allowing access to any workspace within that organization
5. THE System SHALL deny access to organization resources if user is not a member

### Requirement 6: URL структура и маршрутизация

**User Story:** As a user, I want clear URL structure, so that I can easily navigate between organizations and workspaces.

#### Acceptance Criteria

1. THE System SHALL use URL pattern `/orgs/[orgSlug]/workspaces/[workspaceSlug]` for workspace access
2. THE System SHALL validate both orgSlug and workspaceSlug exist and are related
3. THE System SHALL return 404 if organization or workspace not found
4. THE System SHALL return 403 if user lacks access to the organization
5. THE System SHALL support organization-level routes: `/orgs/[orgSlug]/settings`, `/orgs/[orgSlug]/members`
6. THE System SHALL redirect from old workspace URLs to new organization-based URLs

### Requirement 7: Миграция существующих данных

**User Story:** As a system administrator, I want to migrate existing workspaces to organizations, so that existing users can continue working without disruption.

#### Acceptance Criteria

1. THE System SHALL create a default Organization for each existing Workspace owner
2. THE System SHALL migrate workspace ownership to organization ownership
3. THE System SHALL preserve all existing workspace members and their roles
4. THE System SHALL maintain all existing workspace data and relationships
5. THE System SHALL update all workspace references to include organizationId
6. THE System SHALL log migration progress and any errors

### Requirement 8: Приглашения в организацию

**User Story:** As an organization admin, I want to invite users to my organization, so that I can expand my team.

#### Acceptance Criteria

1. WHEN an admin sends an invitation, THE System SHALL create an organization_invites record
2. THE System SHALL generate a unique invitation token with expiration
3. THE System SHALL send an email notification to the invited user
4. WHEN a user accepts an invitation, THE System SHALL add them to the organization with specified role
5. THE System SHALL validate invitation token and expiration before acceptance
6. THE System SHALL prevent duplicate invitations to the same email for the same organization
7. WHEN an invitation expires, THE System SHALL mark it as invalid

### Requirement 9: Переключение между организациями

**User Story:** As a user belonging to multiple organizations, I want to easily switch between them, so that I can manage different organizations efficiently.

#### Acceptance Criteria

1. THE System SHALL display a list of all organizations the user belongs to
2. WHEN a user selects an organization, THE System SHALL navigate to that organization's workspace list
3. THE System SHALL remember the last accessed organization per user
4. THE System SHALL show the current organization name in the navigation
5. THE System SHALL provide a dropdown or menu for organization switching

### Requirement 10: Валидация и ограничения

**User Story:** As a system architect, I want proper validation and constraints, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL validate organization name is not empty and has maximum 100 characters
2. THE System SHALL validate slug matches pattern: lowercase letters, numbers, hyphens only
3. THE System SHALL validate slug length is between 3 and 50 characters
4. THE System SHALL validate email format for invitations
5. THE System SHALL validate URLs for website field
6. THE System SHALL prevent SQL injection and XSS attacks in all inputs
7. THE System SHALL sanitize organization name and description before storage
