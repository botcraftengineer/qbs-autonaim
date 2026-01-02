# Implementation Plan: AI-помощник для создания вакансий

## Overview

Этот план описывает пошаговую реализацию AI-помощника для создания вакансий через чат-интерфейс. Реализация будет основана на существующем паттерне gig chat-generate, но адаптирована для специфики вакансий. Большая часть серверной инфраструктуры уже существует в `/api/vacancy/chat-generate/route.ts`, поэтому фокус будет на клиентской части и интеграции.

## Tasks

- [x] 1. Audit and enhance existing API endpoint
  - Проверить существующую реализацию `/api/vacancy/chat-generate/route.ts`
  - Добавить поддержку дополнительных полей (customBotInstructions, customScreeningPrompt, customInterviewQuestions, customOrganizationalQuestions)
  - Обновить промпт для генерации настроек бота
  - Добавить интеграцию с Company_Settings для персонализации
  - _Requirements: 1.1, 1.2, 1.5, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2_

- [ ]* 1.1 Write property test for API endpoint
  - **Property 1: Message Processing Updates Document**
  - **Property 2: Response Format Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 1.2 Write property test for Company Settings integration
  - **Property 5: Company Settings Integration**
  - **Validates: Requirements 1.5, 7.1**

- [x] 2. Create useVacancyChat custom hook
  - [x] 2.1 Implement state management for document and conversation history
    - Создать state для currentDocument (VacancyDocument)
    - Создать state для conversationHistory (max 10 messages)
    - Создать state для status (idle, loading, streaming, error)
    - Создать state для error
    - _Requirements: 1.4, 9.1, 9.2, 9.3, 9.5_

  - [ ]* 2.1.1 Write property test for conversation history management
    - **Property 4: Conversation History Accumulation**
    - **Property 21: History Context Transmission**
    - **Property 22: History State Persistence**
    - **Validates: Requirements 1.4, 9.1, 9.2, 9.3, 9.4, 9.5**

  - [x] 2.2 Implement sendMessage function with fetch API
    - Создать функцию sendMessage(content: string)
    - Отправить POST запрос на `/api/vacancy/chat-generate`
    - Передать workspaceId, message, currentDocument, conversationHistory
    - Обработать streaming response (SSE)
    - _Requirements: 1.1, 1.2, 9.4_

  - [ ]* 2.2.1 Write property test for message sending
    - **Property 1: Message Processing Updates Document**
    - **Validates: Requirements 1.1**

  - [x] 2.3 Implement streaming response parser
    - Парсить SSE events (data: {...})
    - Обрабатывать partial updates (partial: true)
    - Обрабатывать final update (done: true)
    - Обрабатывать errors
    - Обновлять currentDocument инкрементально
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 2.3.1 Write property test for document field updates
    - **Property 6: Document Field Updates Reflect in UI**
    - **Property 7: Field Preservation Invariant**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

  - [x] 2.4 Implement error handling
    - Обработать network errors
    - Обработать parse errors
    - Обработать validation errors
    - Обработать timeout errors
    - Установить error state
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 2.4.1 Write property test for error handling
    - **Property 17: Parse Error Handling**
    - **Property 18: Network Error Recovery**
    - **Property 19: Validation Error Display**
    - **Validates: Requirements 8.1, 8.2, 8.3**

- [x] 3. Create VacancyChatInterface component
  - [x] 3.1 Create basic chat UI structure
    - Создать компонент VacancyChatInterface
    - Добавить chat messages container
    - Добавить input field для сообщений
    - Добавить send button
    - Использовать useVacancyChat hook
    - _Requirements: 11.1, 11.2, 11.5_

  - [ ]* 3.1.1 Write unit tests for chat UI
    - Тест рендеринга компонента
    - Тест отправки сообщения
    - Тест очистки input после отправки
    - _Requirements: 11.2_

  - [x] 3.2 Implement document preview panel
    - Создать панель для отображения currentDocument
    - Отображать title, description, requirements, responsibilities, conditions
    - Отображать customBotInstructions, customScreeningPrompt, customInterviewQuestions, customOrganizationalQuestions
    - Обновлять панель при изменении документа
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [ ]* 3.2.1 Write property test for document preview updates
    - **Property 6: Document Field Updates Reflect in UI**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**

  - [x] 3.3 Add loading indicator
    - Показывать spinner во время генерации
    - Показывать "typing" indicator в чате
    - Disable input во время генерации
    - _Requirements: 11.1_

  - [ ]* 3.3.1 Write property test for loading indicator
    - **Property 26: Loading Indicator Display**
    - **Validates: Requirements 11.1**

  - [x] 3.4 Implement quick replies (future enhancement)
    - Примечание: Quick replies будут добавлены в будущей итерации
    - Сейчас API не возвращает quickReplies для вакансий
    - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.5 Add error display
    - Показывать error messages в UI
    - Добавить retry button для network errors
    - Показывать validation errors рядом с полями
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 3.5.1 Write unit tests for error display
    - Тест отображения network error
    - Тест отображения parse error
    - Тест отображения validation error
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 4. Checkpoint - Ensure basic chat functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement "Create Vacancy" functionality
  - [x] 5.1 Add "Create Vacancy" button
    - Показывать кнопку когда title не пустой
    - Disable кнопку во время сохранения
    - Добавить loading state на кнопку
    - _Requirements: 6.1, 6.5_

  - [ ]* 5.1.1 Write property test for button visibility
    - **Property 11: Create Button Visibility**
    - **Property 15: Button Disabled During Save**
    - **Validates: Requirements 6.1, 6.5**

  - [x] 5.2 Implement vacancy save mutation
    - Создать tRPC mutation для сохранения вакансии
    - Валидировать данные перед сохранением
    - Сохранить вакансию в БД
    - Вернуть ID созданной вакансии
    - _Requirements: 6.2_

  - [ ]* 5.2.1 Write property test for vacancy persistence
    - **Property 12: Vacancy Persistence**
    - **Validates: Requirements 6.2**

  - [x] 5.3 Implement post-save navigation
    - Перенаправить на страницу вакансии после сохранения
    - Использовать router.push с vacancy ID
    - Показать success toast
    - _Requirements: 6.3_

  - [ ]* 5.3.1 Write property test for navigation
    - **Property 13: Post-Save Navigation**
    - **Validates: Requirements 6.3**

  - [x] 5.4 Handle save errors
    - Показать error message при ошибке сохранения
    - Логировать ошибку в Sentry
    - Не перенаправлять при ошибке
    - _Requirements: 6.4_

  - [ ]* 5.4.1 Write property test for save error handling
    - **Property 14: Save Error Handling**
    - **Validates: Requirements 6.4**

- [x] 6. Add responsive design
  - Адаптировать layout для мобильных устройств
  - Использовать responsive breakpoints
  - Тестировать на разных размерах экрана
  - _Requirements: 11.5_

- [ ]* 6.1 Write property test for responsive layout
  - **Property 29: Responsive Layout**
  - **Validates: Requirements 11.5**

- [ ] 7. Checkpoint - Ensure save functionality works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Enhance API endpoint with bot configuration support
  - [x] 8.1 Update prompt to generate bot settings
    - Добавить инструкции для генерации customBotInstructions
    - Добавить инструкции для генерации customScreeningPrompt
    - Добавить инструкции для генерации customInterviewQuestions
    - Добавить инструкции для генерации customOrganizationalQuestions
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 8.1.1 Write property test for bot configuration generation
    - **Property 10: Bot Configuration Generation**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**

  - [x] 8.2 Update response schema
    - Добавить customBotInstructions в VacancyDocument
    - Добавить customScreeningPrompt в VacancyDocument
    - Добавить customInterviewQuestions в VacancyDocument
    - Добавить customOrganizationalQuestions в VacancyDocument
    - Обновить parseVacancyJSON для новых полей
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Add Company Settings integration
  - [x] 9.1 Load Company Settings in API endpoint
    - Загрузить companySettings из БД
    - Передать в buildVacancyGenerationPrompt
    - _Requirements: 1.5, 7.1_

  - [x] 9.2 Update prompt builder
    - Добавить секцию с Company Settings в промпт
    - Использовать botName для представления
    - Использовать botRole в диалоге
    - Использовать company description для контекста
    - _Requirements: 7.1, 7.2_

  - [ ]* 9.2.1 Write property test for bot name presentation
    - **Property 16: Bot Name Presentation**
    - **Validates: Requirements 7.2**

- [x] 10. Add comprehensive error handling and logging
  - [x] 10.1 Implement client-side error handling
    - Обработать все типы ошибок (network, parse, validation, timeout)
    - Показать понятные сообщения пользователю
    - Добавить retry functionality
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 10.2 Implement server-side error handling
    - Обработать authentication errors (401)
    - Обработать authorization errors (403)
    - Обработать validation errors (400)
    - Обработать rate limit errors (429)
    - Обработать AI generation errors (500)
    - _Requirements: 12.1, 12.2_

  - [ ]* 10.2.1 Write property test for authorization
    - **Property 30: Unauthorized Access Rejection**
    - **Property 31: Forbidden Workspace Access**
    - **Property 32: Request Validation**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4**

  - [x] 10.3 Add Langfuse logging
    - Логировать начало генерации
    - Логировать завершение генерации
    - Логировать ошибки
    - Включать metadata (workspaceId, userId)
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [ ]* 10.3.1 Write property test for Langfuse integration
    - **Property 23: Langfuse Trace Creation**
    - **Property 24: Langfuse Trace Completion**
    - **Property 25: Langfuse Metadata Inclusion**
    - **Property 20: Error Logging**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 8.5**

- [x] 11. Add UI polish and accessibility
  - [x] 11.1 Implement visual feedback
    - Добавить ripple effect на quick reply buttons
    - Добавить smooth transitions для document updates
    - Добавить focus states для accessibility
    - _Requirements: 11.3_

  - [ ]* 11.1.1 Write property test for visual feedback
    - **Property 28: Quick Reply Visual Feedback**
    - **Validates: Requirements 11.3**

  - [x] 11.2 Add keyboard shortcuts
    - Enter для отправки сообщения
    - Escape для очистки input
    - Tab navigation для accessibility
    - _Requirements: 11.2_

  - [x] 11.3 Add accessibility attributes
    - ARIA labels для всех интерактивных элементов
    - Role attributes для semantic HTML
    - Screen reader support
    - _Requirements: 11.5_

- [ ] 12. Final checkpoint - Integration testing
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 13. Write E2E tests
  - [ ]* 13.1 Test complete vacancy creation flow
    - Открыть страницу создания вакансии
    - Отправить сообщение "Нужен Senior TypeScript Developer"
    - Проверить что документ обновился
    - Кликнуть "Создать вакансию"
    - Проверить редирект на страницу вакансии
    - _Requirements: 1.1, 2.1, 6.2, 6.3_

  - [ ]* 13.2 Test error handling flow
    - Тест network error recovery
    - Тест unauthorized access
    - Тест rate limiting
    - _Requirements: 8.2, 12.1_

  - [ ] 13.3 Test responsive design

    - Тест на мобильном размере экрана
    - Тест на планшетном размере экрана
    - Тест на desktop размере экрана
    - _Requirements: 11.5_

## Notes

- Задачи помечены `*` являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements для трассируемости
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
- E2E tests валидируют end-to-end flows

## Implementation Order Rationale

1. **Audit existing API** - Понять что уже работает и что нужно добавить
2. **Create hook** - Инкапсулировать логику работы с API
3. **Create UI** - Построить интерфейс используя hook
4. **Add save functionality** - Позволить сохранять созданные вакансии
5. **Enhance with bot config** - Добавить продвинутые функции
6. **Add Company Settings** - Персонализировать под компанию
7. **Polish and test** - Улучшить UX и покрыть тестами

Этот порядок обеспечивает инкрементальную разработку с ранней валидацией core functionality.
