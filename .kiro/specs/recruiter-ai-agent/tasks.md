# Implementation Plan: AI-ассистент рекрутера

## Overview

Этот план описывает пошаговую реализацию AI-ассистента рекрутера. Реализация будет основана на существующей мультиагентной архитектуре (packages/ai/src/agents) и расширит её новыми специализированными агентами. Фокус на инкрементальной разработке с ранней валидацией core functionality.

## Tasks

- [ ] 1. Create RecruiterAgentOrchestrator
  - [ ] 1.1 Create base orchestrator structure
    - Создать файл `packages/ai/src/agents/recruiter/orchestrator.ts`
    - Расширить паттерн из существующего `orchestrator.ts`
    - Добавить Intent Classifier для определения намерения пользователя
    - Реализовать routing к соответствующим под-агентам
    - _Requirements: 1.1, 1.2_

  - [ ]* 1.1.1 Write property test for intent classification
    - **Property 1: Intent Classification Accuracy**
    - **Validates: Requirements 1.1**

  - [ ] 1.2 Implement conversation context management
    - Создать `packages/ai/src/agents/recruiter/context.ts`
    - Реализовать загрузку контекста (workspace, vacancy, company settings)
    - Реализовать накопление conversation history (max 20 messages)
    - _Requirements: 1.2, 1.5, 7.1, 7.2, 7.3_

  - [ ]* 1.2.1 Write property test for context and history
    - **Property 2: Context Inclusion in Responses**
    - **Property 5: Conversation History Accumulation**
    - **Validates: Requirements 1.2, 1.5, 7.1, 7.2, 7.3**

  - [ ] 1.3 Implement streaming response with action chain
    - Реализовать streaming через SSE
    - Добавить промежуточные обновления для multi-step actions
    - Добавить explanation к каждому действию
    - _Requirements: 1.3, 1.4_

  - [ ]* 1.3.1 Write property test for streaming and explanations
    - **Property 3: Action Chain Streaming**
    - **Property 4: Explanation Presence**
    - **Validates: Requirements 1.3, 1.4**

- [ ] 2. Checkpoint - Ensure orchestrator works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Create CandidateSearchAgent
  - [ ] 3.1 Implement candidate search agent
    - Создать файл `packages/ai/src/agents/recruiter/candidate-search.ts`
    - Расширить BaseAgent
    - Реализовать поиск с фильтрами (availability, fitScore, experience, skills)
    - Интегрировать с существующим candidates router
    - _Requirements: 2.1_

  - [ ] 3.2 Implement fit score calculation
    - Создать `packages/ai/src/agents/recruiter/fit-score.ts`
    - Реализовать расчёт fitScore на основе resumeScore и interviewScore
    - Добавить валидацию диапазона [0, 100]
    - _Requirements: 2.5_

  - [ ]* 3.2.1 Write property test for fit score
    - **Property 7: Fit Score Range Invariant**
    - **Validates: Requirements 2.5**

  - [ ] 3.3 Implement candidate result formatting
    - Добавить whySelected explanation для каждого кандидата
    - Добавить availability detection
    - Добавить riskFactors analysis
    - Добавить recommendation (invite/clarify/reject)
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 3.3.1 Write property test for candidate result completeness
    - **Property 6: Candidate Search Result Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

- [ ] 4. Create VacancyAnalyticsAgent
  - [ ] 4.1 Implement vacancy analytics agent
    - Создать файл `packages/ai/src/agents/recruiter/vacancy-analytics.ts`
    - Расширить BaseAgent
    - Интегрировать с существующим vacancy/analytics.ts
    - Добавить анализ описания, зарплаты, требований
    - _Requirements: 3.1, 3.2_

  - [ ] 4.2 Implement market comparison
    - Создать `packages/ai/src/agents/recruiter/market-analytics.ts`
    - Реализовать сравнение с рынком (salaryPercentile, competitorVacancies)
    - Добавить интеграцию с hh.ru API (если доступно) или mock data
    - _Requirements: 3.5_

  - [ ]* 4.2.1 Write property test for analytics completeness
    - **Property 8: Vacancy Analytics Completeness**
    - **Validates: Requirements 3.2, 3.5**

  - [ ] 4.3 Implement issue detection and recommendations
    - Реализовать выявление проблем (salary, requirements, description, timing)
    - Добавить причинно-следственные объяснения
    - Добавить конкретные рекомендации для каждой проблемы
    - _Requirements: 3.3, 3.4_

  - [ ]* 4.3.1 Write property test for issue-recommendation pairing
    - **Property 9: Issue-Recommendation Pairing**
    - **Validates: Requirements 3.3, 3.4**

- [ ] 5. Checkpoint - Ensure search and analytics work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create ContentGeneratorAgent
  - [ ] 6.1 Implement content generator agent
    - Создать файл `packages/ai/src/agents/recruiter/content-generator.ts`
    - Расширить BaseAgent
    - Реализовать генерацию vacancy content (title, description, requirements)
    - Добавить SEO оптимизацию и keywords
    - _Requirements: 4.1, 4.2_

  - [ ]* 6.1.1 Write property test for content generation
    - **Property 10: Content Generation Completeness**
    - **Validates: Requirements 4.1, 4.2**

  - [ ] 6.2 Implement A/B variants generation
    - Добавить генерацию нескольких вариантов заголовка
    - Реализовать структуру для A/B тестирования
    - _Requirements: 4.3_

  - [ ]* 6.2.1 Write property test for A/B variants
    - **Property 11: A/B Variants Generation**
    - **Validates: Requirements 4.3**

- [ ] 7. Create CommunicationAgent
  - [ ] 7.1 Implement communication agent
    - Создать файл `packages/ai/src/agents/recruiter/communication.ts`
    - Расширить BaseAgent
    - Реализовать генерацию персонализированных сообщений
    - Поддержать типы: greeting, clarification, invite, followup, rejection
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 7.1.1 Write property test for message personalization
    - **Property 12: Message Personalization**
    - **Property 13: Message Type Coverage**
    - **Validates: Requirements 5.1, 5.2, 5.3**

  - [ ] 7.2 Implement message logging
    - Добавить логирование всех отправленных сообщений
    - Интегрировать с audit logger
    - _Requirements: 5.5_

  - [ ]* 7.2.1 Write property test for message logging
    - **Property 14: Message Logging**
    - **Validates: Requirements 5.5, 9.3**

- [ ] 8. Checkpoint - Ensure content and communication work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Create RuleEngine
  - [ ] 9.1 Implement rule engine core
    - Создать файл `packages/ai/src/agents/recruiter/rule-engine.ts`
    - Реализовать структуру правил (condition, action, priority)
    - Реализовать evaluation условий
    - _Requirements: 6.1, 6.2_

  - [ ]* 9.1.1 Write property test for rule application
    - **Property 15: Rule Application Consistency**
    - **Validates: Requirements 6.1, 6.2**

  - [ ] 9.2 Implement autonomy levels
    - Реализовать три уровня: advise, confirm, autonomous
    - Добавить pending_approval статус для confirm level
    - _Requirements: 6.4_

  - [ ]* 9.2.1 Write property test for autonomy levels
    - **Property 16: Autonomy Level Enforcement**
    - **Validates: Requirements 6.4**

  - [ ] 9.3 Implement action executor with undo
    - Создать `packages/ai/src/agents/recruiter/action-executor.ts`
    - Реализовать выполнение действий с логированием
    - Добавить undo window для отмены действий
    - _Requirements: 6.3, 9.4_

  - [ ]* 9.3.1 Write property test for action undo
    - **Property 19: Action Undo Window**
    - **Validates: Requirements 9.4**

- [ ] 10. Create tRPC Router
  - [ ] 10.1 Create recruiterAgent router
    - Создать файл `packages/api/src/routers/recruiter-agent/index.ts`
    - Добавить chat procedure (streaming)
    - Добавить executeAction procedure
    - Добавить getRecommendations procedure
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 10.2 Implement authorization checks
    - Добавить проверку workspace access
    - Добавить проверку прав на действия
    - _Requirements: 9.1_

  - [ ]* 10.2.1 Write property test for authorization
    - **Property 18: Authorization Check**
    - **Validates: Requirements 9.1**

  - [ ] 10.3 Implement rate limiting
    - Добавить rate limiter для chat (30/min)
    - Добавить rate limiter для actions (100/hour)
    - _Requirements: 9.5_

  - [ ]* 10.3.1 Write property test for rate limiting
    - **Property 20: Rate Limiting**
    - **Validates: Requirements 9.5**

- [ ] 11. Checkpoint - Ensure API works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create React Components
  - [ ] 12.1 Create useRecruiterAgent hook
    - Создать файл `apps/app/src/hooks/use-recruiter-agent.ts`
    - Реализовать state management для document и history
    - Реализовать sendMessage с streaming
    - Реализовать error handling
    - _Requirements: 1.1, 1.5_

  - [ ] 12.2 Create RecruiterAgentChat component
    - Создать файл `apps/app/src/components/recruiter-agent/chat.tsx`
    - Реализовать chat UI с messages container
    - Добавить input field и send button
    - Добавить loading indicator
    - _Requirements: 1.1, 1.3_

  - [ ] 12.3 Create CandidateResultCard component
    - Создать компонент для отображения результатов поиска кандидатов
    - Показывать fitScore, whySelected, recommendation
    - Добавить action buttons (invite, clarify, reject)
    - _Requirements: 2.2, 2.4_

  - [ ] 12.4 Create VacancyAnalyticsPanel component
    - Создать компонент для отображения аналитики вакансии
    - Показывать metrics, issues, recommendations
    - Добавить визуализацию market comparison
    - _Requirements: 3.2, 3.4_

- [ ] 13. Implement Feedback System
  - [ ] 13.1 Create feedback API
    - Добавить submitFeedback procedure в router
    - Реализовать сохранение feedback в БД
    - _Requirements: 10.1_

  - [ ]* 13.1.1 Write property test for feedback persistence
    - **Property 21: Feedback Persistence**
    - **Validates: Requirements 10.1**

  - [ ] 13.2 Implement feedback influence
    - Добавить загрузку feedback history в контекст агента
    - Модифицировать recommendations на основе feedback
    - _Requirements: 10.2_

  - [ ]* 13.2.1 Write property test for feedback influence
    - **Property 22: Feedback Influence**
    - **Validates: Requirements 10.2**

  - [ ] 13.3 Implement quality metrics
    - Добавить расчёт acceptance/rejection rate
    - Добавить API для получения метрик
    - _Requirements: 10.4_

  - [ ]* 13.3.1 Write property test for quality metrics
    - **Property 23: Quality Metrics Calculation**
    - **Validates: Requirements 10.4**

- [ ] 14. Implement Company Settings Integration
  - [ ] 14.1 Load company settings in orchestrator
    - Загружать companySettings из БД
    - Передавать в контекст всех агентов
    - _Requirements: 7.5_

  - [ ]* 14.1.1 Write property test for company settings
    - **Property 17: Company Settings Adaptation**
    - **Validates: Requirements 7.5**

- [ ] 15. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 16. Write E2E tests
  - [ ]* 16.1 Test candidate search flow
    - Открыть страницу с агентом
    - Отправить запрос "Найди 5 кандидатов, готовых выйти за 2 недели"
    - Проверить что результаты отображаются
    - Проверить что каждый кандидат имеет fitScore и recommendation
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ]* 16.2 Test vacancy analytics flow
    - Открыть страницу вакансии
    - Спросить "Почему мало откликов?"
    - Проверить что анализ отображается
    - Проверить что есть рекомендации
    - _Requirements: 3.1, 3.4_

  - [ ]* 16.3 Test rule engine flow
    - Создать правило для автоматического приглашения
    - Добавить кандидата с высоким fitScore
    - Проверить что правило сработало
    - _Requirements: 6.1, 6.2_

## Notes

- Задачи помечены `*` являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- E2E tests валидируют end-to-end flows

## Implementation Order Rationale

1. **Orchestrator** - Основа системы, координирует все агенты
2. **CandidateSearchAgent** - Core functionality для рекрутера
3. **VacancyAnalyticsAgent** - Аналитика для улучшения вакансий
4. **ContentGeneratorAgent** - Генерация контента
5. **CommunicationAgent** - Автоматизация переписки
6. **RuleEngine** - Автономные решения
7. **tRPC Router** - API для клиента
8. **React Components** - UI для взаимодействия
9. **Feedback System** - Обучение на решениях рекрутера
10. **Company Settings** - Персонализация

Этот порядок обеспечивает инкрементальную разработку с ранней валидацией core functionality.

## File Structure

```
packages/ai/src/agents/recruiter/
├── index.ts                    # Exports
├── orchestrator.ts             # RecruiterAgentOrchestrator
├── context.ts                  # ConversationContext management
├── candidate-search.ts         # CandidateSearchAgent
├── fit-score.ts                # Fit score calculation
├── vacancy-analytics.ts        # VacancyAnalyticsAgent
├── market-analytics.ts         # Market comparison
├── content-generator.ts        # ContentGeneratorAgent
├── communication.ts            # CommunicationAgent
├── rule-engine.ts              # RuleEngine
├── action-executor.ts          # ActionExecutor
└── types.ts                    # Shared types

packages/api/src/routers/recruiter-agent/
├── index.ts                    # Router exports
├── chat.ts                     # Chat procedure (streaming)
├── execute-action.ts           # Action execution
├── get-recommendations.ts      # Get recommendations
├── configure-rules.ts          # Rule configuration
└── feedback.ts                 # Feedback submission

apps/app/src/
├── hooks/
│   └── use-recruiter-agent.ts  # Custom hook
└── components/recruiter-agent/
    ├── chat.tsx                # Chat interface
    ├── candidate-card.tsx      # Candidate result card
    ├── analytics-panel.tsx     # Vacancy analytics
    └── rule-config.tsx         # Rule configuration UI
```
