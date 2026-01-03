# Implementation Plan: Candidate Prequalification System

## Overview

Реализация системы преквалификации кандидатов через white-label виджет. План разбит на инкрементальные задачи, каждая из которых строится на предыдущих. Используется TypeScript, tRPC, Drizzle ORM, fast-check для property-based тестирования.

## Tasks

- [x] 1. Создание схемы базы данных для преквалификации
  - [x] 1.1 Создать таблицу prequalification_sessions
    - Добавить файл `packages/db/src/schema/prequalification/session.ts`
    - Определить все поля: id, workspaceId, vacancyId, responseId, conversationId, status, source, parsedResume, fitScore, fitDecision, evaluation, candidateFeedback, consentGivenAt, userAgent, ipAddress, expiresAt, timestamps
    - Создать индексы для workspaceId, vacancyId, status, fitScore
    - Экспортировать схему и типы
    - _Requirements: 1.6, 2.4, 3.2, 3.3, 4.1, 8.1_

  - [x] 1.2 Создать таблицу widget_configs
    - Добавить файл `packages/db/src/schema/prequalification/widget-config.ts`
    - Определить поля брендинга: logo, primaryColor, secondaryColor, backgroundColor, textColor, fontFamily, assistantName, assistantAvatar, welcomeMessage, completionMessage
    - Определить поля поведения: passThreshold, mandatoryQuestions, tone, honestyLevel, maxDialogueTurns, sessionTimeoutMinutes
    - Определить поля legal: consentText, disclaimerText, privacyPolicyUrl, dataRetentionDays
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 1.3 Создать таблицу custom_domains
    - Добавить файл `packages/db/src/schema/prequalification/custom-domain.ts`
    - Определить поля: domain, cnameTarget, verified, verifiedAt, lastVerificationAttempt, verificationError, sslStatus, sslCertificateId, sslExpiresAt
    - Создать уникальный индекс на domain
    - _Requirements: 10.1, 10.2, 10.3, 10.7_

  - [x] 1.4 Создать таблицу analytics_events
    - Добавить файл `packages/db/src/schema/prequalification/analytics-event.ts`
    - Определить поля: workspaceId, vacancyId, sessionId, eventType, metadata, timestamp
    - Создать индексы для эффективных запросов аналитики
    - _Requirements: 9.1, 9.4_

  - [x] 1.5 Создать index.ts и relations для prequalification схемы
    - Экспортировать все таблицы из `packages/db/src/schema/prequalification/index.ts`
    - Определить relations между таблицами
    - Обновить `packages/db/src/schema/index.ts` для экспорта prequalification
    - _Requirements: 7.1_

- [x] 2. Checkpoint - Проверка схемы БД
  - Убедиться, что все таблицы созданы корректно
  - Проверить типы и индексы
  - Спросить пользователя, если возникнут вопросы

- [x] 3. Реализация Resume Parser Service
  - [x] 3.1 Создать интерфейсы и типы для Resume Parser
    - Добавить файл `packages/api/src/services/resume-parser/types.ts`
    - Определить ResumeInput, ParsedResume, StructuredResume, WorkExperience, Education, Language
    - Определить ValidationResult и ParserError типы
    - _Requirements: 1.1, 1.2_

  - [x] 3.2 Реализовать PDF парсер
    - Добавить файл `packages/api/src/services/resume-parser/pdf-parser.ts`
    - Использовать pdf-parse для извлечения текста
    - Реализовать структурирование данных с помощью AI
    - _Requirements: 1.1_

  - [x] 3.3 Реализовать DOCX парсер
    - Добавить файл `packages/api/src/services/resume-parser/docx-parser.ts`
    - Использовать mammoth для извлечения текста
    - Реализовать структурирование данных с помощью AI
    - _Requirements: 1.2_

  - [x] 3.4 Реализовать основной Resume Parser Service
    - Добавить файл `packages/api/src/services/resume-parser/index.ts`
    - Реализовать validateFormat для проверки расширения файла
    - Реализовать parse с выбором парсера по типу файла
    - Обработать ошибки и edge cases
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]* 3.5 Написать property test для Resume Parser
    - **Property 1: Resume Parsing Produces Structured Output**
    - **Property 2: Invalid File Format Rejection**
    - **Validates: Requirements 1.1, 1.2, 1.4**

- [x] 4. Реализация Prequalification Service
  - [x] 4.1 Создать интерфейсы и типы для Prequalification Service
    - Добавить файл `packages/api/src/services/prequalification/types.ts`
    - Определить CreateSessionInput, PrequalificationSession, SessionStatus
    - Определить AIResponse, EvaluationInput, EvaluationResult
    - _Requirements: 1.6, 2.4, 3.1_

  - [x] 4.2 Реализовать управление сессиями
    - Добавить файл `packages/api/src/services/prequalification/session-manager.ts`
    - Реализовать createSession с проверкой consent
    - Реализовать getSession с проверкой tenant ownership
    - Реализовать updateSessionStatus с валидацией state machine
    - _Requirements: 1.6, 7.2, 8.1_

  - [x] 4.3 Написать property tests для Session State Machine (MANDATORY - Security/Compliance)
    - **Property 3: Session State Machine Transitions**
    - **Validates: Requirements 1.6, 2.4**
    - **Property 11: Consent Requirement Enforcement**
    - **Validates: Requirements 8.1**
    - _Note: These properties are mandatory for MVP sign-off as they enforce security and compliance requirements_

  - [x] 4.4 Реализовать обработку резюме в сессии
    - Добавить метод uploadResume в session-manager.ts
    - Интегрировать с Resume Parser Service
    - Сохранить parsedResume в сессию
    - Обновить статус на dialogue_active
    - _Requirements: 1.6_

  - [x] 4.5 Реализовать обработку сообщений диалога
    - Добавить файл `packages/api/src/services/prequalification/dialogue-handler.ts`
    - Интегрировать с существующим InterviewOrchestrator
    - Передавать контекст вакансии и резюме в AI
    - Проверять mandatory questions
    - _Requirements: 2.1, 2.3, 2.5, 2.6_

  - [ ]* 4.6 Написать property test для Mandatory Questions
    - **Property 4: Mandatory Questions Inclusion**
    - **Validates: Requirements 2.6**

- [x] 5. Checkpoint - Проверка базовой функциональности
  - Убедиться, что сессии создаются и управляются корректно
  - Проверить интеграцию с Resume Parser
  - **MANDATORY: Property 3 (Session State Machine) and Property 11 (Consent Enforcement) must pass**
  - Спросить пользователя, если возникнут вопросы

- [-] 6. Реализация Evaluation Service
  - [x] 6.1 Создать интерфейсы для Evaluation Service
    - Добавить файл `packages/api/src/services/evaluation/types.ts`
    - Определить EvaluationInput, EvaluationResult, DimensionScore
    - Определить FeedbackConfig и FitDecision
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 6.2 Реализовать оценку кандидата
    - Добавить файл `packages/api/src/services/evaluation/evaluator.ts`
    - Реализовать evaluate с использованием AI для анализа
    - Рассчитать scores по dimensions: hardSkills, softSkills, cultureFit, salaryAlignment
    - Рассчитать общий fitScore и определить fitDecision на основе threshold
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.3 Написать property tests для Evaluation
    - **Property 5: Evaluation Score Validity**
    - **Property 6: Threshold Determines Fit Decision**
    - **Property 7: Evaluation Contains All Dimensions**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 6.4 Реализовать генерацию feedback для кандидата
    - Добавить файл `packages/api/src/services/evaluation/feedback-generator.ts`
    - Реализовать generateFeedback с учётом honestyLevel
    - Генерировать конструктивный feedback для not_fit
    - _Requirements: 4.2, 4.4, 4.5_

  - [ ]* 6.5 Написать property test для Feedback Generation
    - **Property 8: Candidate Feedback Generation**
    - **Validates: Requirements 4.2, 4.4**

- [x] 7. Реализация Widget Config Service
  - [x] 7.1 Создать интерфейсы для Widget Config
    - Добавить файл `packages/api/src/services/widget-config/types.ts`
    - Определить WidgetConfiguration, BrandingConfig, BehaviorConfig, LegalConfig
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Реализовать CRUD для Widget Config
    - Добавить файл `packages/api/src/services/widget-config/index.ts`
    - Реализовать getConfig с tenant isolation
    - Реализовать updateConfig с валидацией
    - Реализовать getDefaultConfig для новых workspaces
    - _Requirements: 6.1, 6.2, 6.3, 7.2_

  - [ ]* 7.3 Написать property test для Widget Config
    - **Property 10: Widget Configuration Persistence Round-Trip**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Реализация Tenant Isolation
  - [x] 8.1 Создать middleware для tenant verification
    - Добавить файл `packages/api/src/middleware/tenant-guard.ts`
    - Реализовать проверку workspaceId для всех операций
    - Добавить logging для audit
    - _Requirements: 7.1, 7.2_

  - [x] 8.2 Написать property test для Tenant Isolation (MANDATORY - Security)
    - **Property 9: Tenant Data Isolation**
    - **Validates: Requirements 5.3, 5.4, 7.1, 7.2**
    - _Note: This property is mandatory for MVP sign-off as it enforces tenant data isolation security_

- [x] 9. Checkpoint - Проверка core services
  - Убедиться, что все сервисы работают корректно
  - Проверить tenant isolation
  - **MANDATORY: Property 9 (Tenant Data Isolation) must pass**
  - Спросить пользователя, если возникнут вопросы

- [x] 10.  Реализация tRPC Router для Prequalification
  - [x] 10.1 Создать prequalification router
    - Добавить файл `packages/api/src/router/prequalification.ts`
    - Реализовать createSession procedure
    - Реализовать uploadResume procedure
    - Реализовать sendMessage procedure
    - Реализовать getResult procedure
    - Реализовать submitApplication procedure
    - _Requirements: 1.1, 1.6, 2.1, 4.1, 5.1_

  - [x] 10.2 Создать widget-config router
    - Добавить файл `packages/api/src/router/widget-config.ts`
    - Реализовать getConfig procedure (public)
    - Реализовать updateConfig procedure (admin only)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 10.3 Интегрировать routers в appRouter
    - Обновить `packages/api/src/root.ts`
    - Добавить prequalification и widgetConfig routers
    - _Requirements: все_

- [x] 11. Реализация Analytics Service
  - [x] 11.1 Создать интерфейсы для Analytics
    - Добавить файл `packages/api/src/services/analytics/types.ts`
    - Определить AnalyticsEvent, EventType, DashboardData, FunnelMetrics
    - _Requirements: 9.1, 9.4_

  - [x] 11.2 Реализовать tracking событий
    - Добавить файл `packages/api/src/services/analytics/tracker.ts`
    - Реализовать trackEvent для записи событий
    - Интегрировать с prequalification service
    - _Requirements: 9.4_

  - [x] 11.3 Реализовать агрегацию метрик
    - Добавить файл `packages/api/src/services/analytics/aggregator.ts`
    - Реализовать getDashboard с расчётом всех метрик
    - Реализовать getVacancyAnalytics
    - Реализовать getFunnelMetrics
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 11.4 Написать property test для Analytics Funnel
    - **Property 13: Analytics Funnel Metrics Consistency**
    - **Validates: Requirements 9.4**

  - [x] 11.5 Реализовать экспорт данных
    - Добавить файл `packages/api/src/services/analytics/exporter.ts`
    - Реализовать exportData в CSV и JSON форматах
    - _Requirements: 9.5_

  - [x] 11.6 Создать analytics router
    - Добавить файл `packages/api/src/router/analytics.ts`
    - Реализовать getDashboard, getVacancyAnalytics, exportData procedures
    - _Requirements: 9.1, 9.2, 9.5_

- [x] 12. Реализация Custom Domain Service
  - [x] 12.1 Создать интерфейсы для Custom Domain
    - Добавить файл `packages/api/src/services/custom-domain/types.ts`
    - Определить CustomDomainConfig, DomainValidationResult, SSLProvisionResult
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 12.2 Реализовать DNS verification
    - Добавить файл `packages/api/src/services/custom-domain/dns-verifier.ts`
    - Реализовать verifyDNS с проверкой CNAME записи
    - Генерировать понятные сообщения об ошибках
    - _Requirements: 10.2, 10.4_

  - [x] 12.3 Реализовать SSL provisioning
    - Добавить файл `packages/api/src/services/custom-domain/ssl-provisioner.ts`
    - Интегрировать с Yandex Cloud Certificate Manager API
    - Реализовать provisionSSL и checkSSLStatus
    - _Requirements: 10.3_

  - [x] 12.4 Реализовать Custom Domain Service
    - Добавить файл `packages/api/src/services/custom-domain/index.ts`
    - Реализовать registerDomain с проверкой уникальности
    - Реализовать verifyAndProvision workflow
    - _Requirements: 10.1, 10.2, 10.3, 10.7_

  - [ ]* 12.5 Написать property test для Custom Domain Uniqueness
    - **Property 14: Custom Domain Uniqueness**
    - **Validates: Requirements 10.7**

  - [x] 12.6 Создать custom-domain router
    - Добавить файл `packages/api/src/router/custom-domain.ts`
    - Реализовать registerDomain, verifyDomain, getStatus procedures
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 13. Checkpoint - Проверка всех сервисов
  - Убедиться, что все сервисы интегрированы
  - Проверить все routers
  - Спросить пользователя, если возникнут вопросы

- [x] 14. Реализация Audit Logging
  - [x] 14.1 Расширить AuditLoggerService для prequalification
    - Обновить `packages/api/src/services/audit-logger.ts`
    - Добавить типы событий для prequalification
    - Реализовать логирование всех state-changing операций
    - _Requirements: 7.3, 8.4_

  - [ ]* 14.2 Написать property test для Audit Logging
    - **Property 12: Audit Log Completeness**
    - **Validates: Requirements 7.3, 8.4**

- [x] 15. Реализация Zod валидаторов
  - [x] 15.1 Создать валидаторы для prequalification
    - Добавить файл `packages/validators/src/prequalification.ts`
    - Создать схемы для CreateSessionInput, UploadResumeInput, SendMessageInput
    - Создать схемы для WidgetConfigUpdate, CustomDomainRegister
    - _Requirements: все_

- [x] 16. Final Checkpoint - Полная проверка
  - Убедиться, что все тесты проходят
  - **MANDATORY: All security/compliance properties must pass (Property 3, 9, 11)**
  - Проверить интеграцию всех компонентов
  - Спросить пользователя, если возникнут вопросы

## Notes

### Property-Based Test Classification

Property-based tests are split into two categories:

#### Requirement-Dependent (Mandatory)
These properties MUST pass before MVP sign-off as they enforce security and compliance requirements:

- **Property 3: Session State Machine Transitions** (Task 4.3)
  - Validates: Requirements 1.6, 2.4
  - Reason: Ensures correct session lifecycle and prevents invalid state transitions

- **Property 9: Tenant Data Isolation** (Task 8.2)
  - Validates: Requirements 5.3, 5.4, 7.1, 7.2
  - Reason: Critical security property preventing cross-tenant data leakage

- **Property 11: Consent Requirement Enforcement** (Task 4.3)
  - Validates: Requirements 8.1
  - Reason: Compliance requirement ensuring GDPR/privacy consent is obtained

#### Timeline-Dependent (Optional)
These properties are marked with `*` and can be deferred for faster MVP delivery:

- **Property 1, 2**: Resume Parsing (Task 3.5)
- **Property 4**: Mandatory Questions (Task 4.6)
- **Property 5, 6, 7**: Evaluation Scores (Task 6.3)
- **Property 8**: Feedback Generation (Task 6.5)
- **Property 10**: Widget Config Round-Trip (Task 7.3)
- **Property 12**: Audit Log Completeness (Task 14.2)
- **Property 13**: Analytics Funnel Metrics (Task 11.4)
- **Property 14**: Custom Domain Uniqueness (Task 12.5)

### General Notes

- Каждая задача ссылается на конкретные требования для traceability
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- Используется `fast-check` для property-based тестирования
- **MVP Sign-off requires all mandatory property tests to pass**
