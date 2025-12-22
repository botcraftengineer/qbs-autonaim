# Requirements Document

## Introduction

Устранение циклической зависимости между пакетами `@qbs-autonaim/jobs` и `@qbs-autonaim/tg-client` для обеспечения корректной сборки и поддерживаемости проекта.

## Glossary

- **Circular_Dependency**: Циклическая зависимость между двумя или более пакетами, когда пакет A зависит от пакета B, а пакет B зависит от пакета A
- **TG_Client**: Пакет `@qbs-autonaim/tg-client` - низкоуровневый клиент для работы с Telegram API
- **Jobs**: Пакет `@qbs-autonaim/jobs` - пакет с бизнес-логикой и фоновыми задачами
- **Shared_Package**: Новый пакет `@qbs-autonaim/shared` для общих типов и утилит
- **Message_Handler**: Обработчик входящих сообщений из Telegram
- **Buffer_Service**: Сервис буферизации сообщений для debounce

## Requirements

### Requirement 1: Создание общего пакета

**User Story:** Как разработчик, я хочу иметь общий пакет для типов и утилит, чтобы избежать циклических зависимостей между пакетами.

#### Acceptance Criteria

1. THE System SHALL create a new package `@qbs-autonaim/shared`
2. THE Shared_Package SHALL export common types used by both TG_Client and Jobs
3. THE Shared_Package SHALL export utility functions used by both TG_Client and Jobs
4. THE Shared_Package SHALL NOT depend on TG_Client or Jobs
5. THE Shared_Package SHALL have proper TypeScript configuration and build setup

### Requirement 2: Перемещение типов в общий пакет

**User Story:** Как разработчик, я хочу переместить общие типы в отдельный пакет, чтобы оба пакета могли их использовать без циклических зависимостей.

#### Acceptance Criteria

1. WHEN type `messageBufferService` is needed, THE System SHALL import it from Shared_Package
2. THE Shared_Package SHALL export `MessageBufferService` type interface
3. THE Shared_Package SHALL export `ConversationMetadata` type
4. THE Shared_Package SHALL export `MessageData` type
5. THE System SHALL remove type imports between TG_Client and Jobs

### Requirement 3: Перемещение утилит в общий пакет

**User Story:** Как разработчик, я хочу переместить общие утилиты в отдельный пакет, чтобы избежать дублирования кода и циклических зависимостей.

#### Acceptance Criteria

1. WHEN `getQuestionCount` is needed, THE System SHALL import it from Shared_Package
2. WHEN `getConversationMetadata` is needed, THE System SHALL import it from Shared_Package
3. THE Shared_Package SHALL export `getQuestionCount` function
4. THE Shared_Package SHALL export `getConversationMetadata` function
5. THE System SHALL remove utility imports between TG_Client and Jobs

### Requirement 4: Рефакторинг Message_Handler

**User Story:** Как разработчик, я хочу переместить обработчик сообщений в правильный пакет, чтобы соблюдать архитектурные принципы.

#### Acceptance Criteria

1. WHEN incoming message is received, THE Jobs SHALL handle message processing
2. THE TG_Client SHALL only handle Telegram API communication
3. THE Message_Handler SHALL be moved from TG_Client to Jobs
4. THE TG_Client SHALL export only SDK and low-level handlers
5. THE Jobs SHALL import TG_Client SDK for sending messages

### Requirement 5: Обновление зависимостей пакетов

**User Story:** Как разработчик, я хочу обновить зависимости пакетов, чтобы устранить циклическую зависимость.

#### Acceptance Criteria

1. THE TG_Client SHALL NOT depend on Jobs
2. THE Jobs SHALL depend on TG_Client for SDK only
3. THE TG_Client SHALL depend on Shared_Package
4. THE Jobs SHALL depend on Shared_Package
5. WHEN building packages, THE System SHALL NOT report circular dependency errors

### Requirement 6: Сохранение функциональности

**User Story:** Как пользователь системы, я хочу, чтобы все функции работали как прежде, чтобы рефакторинг не сломал существующую функциональность.

#### Acceptance Criteria

1. WHEN message is received, THE System SHALL process it correctly
2. WHEN message is sent, THE System SHALL send it via Telegram
3. THE System SHALL maintain all existing interview logic
4. THE System SHALL maintain all existing buffer logic
5. THE System SHALL pass all existing tests

### Requirement 7: Обновление импортов

**User Story:** Как разработчик, я хочу обновить все импорты в проекте, чтобы они указывали на правильные пакеты.

#### Acceptance Criteria

1. WHEN importing types, THE System SHALL import from Shared_Package
2. WHEN importing utilities, THE System SHALL import from Shared_Package
3. WHEN importing TG SDK, THE System SHALL import from TG_Client
4. WHEN importing message handler, THE System SHALL import from Jobs
5. THE System SHALL have no broken imports after refactoring

### Requirement 8: Документация изменений

**User Story:** Как разработчик, я хочу иметь документацию по новой архитектуре, чтобы понимать структуру зависимостей.

#### Acceptance Criteria

1. THE System SHALL document new package structure
2. THE System SHALL document dependency graph
3. THE System SHALL document migration guide
4. THE System SHALL update README files in affected packages
5. THE System SHALL document exported APIs from Shared_Package
