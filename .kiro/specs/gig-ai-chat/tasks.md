# Implementation Plan: Gig AI Chat

## Overview

Пошаговая реализация AI чата для gig заданий. Реализация использует существующие паттерны из `gig.chatGenerate` и `vacancy.chatGenerate`, адаптированные для аналитики кандидатов.

## Tasks

- [x] 1. Создать схему базы данных для чат-сессий
  - [x] 1.1 Создать таблицу gig_chat_sessions
    - Добавить файл `packages/db/src/schema/gig/chat-session.ts`
    - Поля: id, gigId, userId, messageCount, lastMessageAt, createdAt, updatedAt
    - Уникальный индекс на (gigId, userId)
    - _Requirements: 1.1, 1.2_

  - [x] 1.2 Создать таблицу gig_chat_messages
    - Добавить в тот же файл или отдельный `chat-message.ts`
    - Поля: id, sessionId, role (enum), content, quickReplies (jsonb), metadata (jsonb), createdAt
    - Индексы на sessionId и (sessionId, createdAt)
    - _Requirements: 1.3_

  - [x] 1.3 Экспортировать схемы и обновить index.ts
    - Обновить `packages/db/src/schema/gig/index.ts`
    - Обновить `packages/db/src/schema/index.ts`
    - _Requirements: 1.1, 1.2_

- [x] 2. Реализовать сервисы загрузки контекста
  - [x] 2.1 Создать GigContextLoader
    - Создать `packages/api/src/services/gig-chat/context-loader.ts`
    - Функция `loadGigContext(gigId)` возвращает GigContext
    - Включить все поля gig: title, description, requirements, type, budget, deadline
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 2.2 Создать CandidatesContextLoader
    - Функция `loadCandidatesContext(gigId)` возвращает CandidatesContext
    - JOIN с gig_response_screenings для screening данных
    - JOIN с interview_scorings для interview данных
    - Рассчитать статистику: total, byStatus, avgPrice, avgScores
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 2.3 Написать property test для загрузки контекста
    - **Property 4: Gig Context Completeness**
    - **Property 5: Candidates Context Completeness**
    - **Validates: Requirements 2.1, 2.2, 2.3, 3.1-3.6**

- [x] 3. Реализовать построитель промпта
  - [x] 3.1 Создать ChatPromptBuilder
    - Создать `packages/api/src/services/gig-chat/prompt-builder.ts`
    - Функция `buildGigAIChatPrompt(message, gigContext, candidatesContext, history)`
    - Системная инструкция с ролью AI-помощника по анализу кандидатов
    - Форматирование контекста gig и кандидатов
    - Ограничение истории до 10 последних сообщений
    - _Requirements: 4.1-4.8, 5.1-5.7, 6.1-6.6_

  - [x] 3.2 Реализовать суммаризацию для больших пулов кандидатов
    - Если кандидатов > 20, показывать только топ-10 и статистику
    - Если кандидатов > 50, использовать агрегированную сводку
    - _Requirements: 12.1, 12.2_

- [x] 4. Реализовать tRPC роутер
  - [x] 4.1 Создать базовую структуру роутера
    - Создать `packages/api/src/routers/gig/ai-chat.ts`
    - Определить input/output схемы с Zod
    - Экспортировать роутер
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 4.2 Реализовать sendMessage mutation
    - Проверка доступа к workspace
    - Загрузка или создание сессии
    - Загрузка контекста gig и кандидатов
    - Построение промпта
    - Вызов streamText
    - Парсинг и валидация ответа
    - Сохранение сообщений в БД
    - _Requirements: 10.1, 10.6_

  - [x] 4.3 Реализовать getHistory query
    - Загрузка сессии по gigId и userId
    - Загрузка последних N сообщений
    - Возврат с пагинацией
    - _Requirements: 10.2, 1.3_

  - [x] 4.4 Реализовать clearHistory mutation
    - Удаление всех сообщений сессии
    - Сброс messageCount
    - _Requirements: 1.6, 10.3_

  - [x] 4.5 Добавить роутер в gig router
    - Обновить `packages/api/src/routers/gig/index.ts`
    - Добавить `aiChat: aiChatRouter`
    - _Requirements: 10.1_

  - [ ]* 4.6 Написать property tests для авторизации
    - **Property 6: Authorization Access Control**
    - **Validates: Requirements 10.4, 14.1, 14.2, 14.3**

  - [ ]* 4.7 Написать property test для схемы ответа
    - **Property 7: Response Schema Validation**
    - **Validates: Requirements 10.6**

- [ ] 5. Checkpoint - Backend готов
  - Убедиться что все тесты проходят
  - Проверить что API работает через tRPC playground
  - Спросить пользователя если есть вопросы

- [x] 6. Реализовать rate limiting
  - [x] 6.1 Добавить rate limiter в sendMessage
    - Использовать in-memory или Redis для счётчика
    - Лимит: 20 сообщений в минуту на пользователя
    - Возвращать 429 с retry-after header
    - _Requirements: 12.4_

  - [ ]* 6.2 Написать property test для rate limiting
    - **Property 9: Rate Limiting Enforcement**
    - **Validates: Requirements 12.4**

- [x] 7. Реализовать UI компоненты
  - [x] 7.1 Создать GigAIChatPanel
    - Создать `apps/app/src/components/gig/ai-chat/gig-ai-chat-panel.tsx`
    - Sheet/Drawer компонент с заголовком
    - Состояние: messages, isLoading, error
    - Загрузка истории при открытии
    - _Requirements: 8.1_

  - [x] 7.2 Создать ChatMessageList
    - Создать `apps/app/src/components/gig/ai-chat/chat-message-list.tsx`
    - Отображение сообщений с разделением user/assistant
    - Поддержка markdown через react-markdown
    - Auto-scroll к последнему сообщению
    - _Requirements: 8.2, 8.4, 8.6_

  - [x] 7.3 Создать ChatInput
    - Создать `apps/app/src/components/gig/ai-chat/chat-input.tsx`
    - Textarea с автоматическим resize
    - Enter для отправки, Shift+Enter для новой строки
    - Disabled состояние во время загрузки
    - _Requirements: 8.7_

  - [x] 7.4 Создать QuickReplies
    - Создать `apps/app/src/components/gig/ai-chat/quick-replies.tsx`
    - Кнопки под последним сообщением AI
    - Клик отправляет текст как новое сообщение
    - _Requirements: 7.5, 8.5_

  - [x] 7.5 Создать TypingIndicator
    - Создать `apps/app/src/components/gig/ai-chat/typing-indicator.tsx`
    - Анимированные точки во время генерации
    - _Requirements: 8.3_

- [x] 8. Интегрировать чат в страницу gig
  - [x] 8.1 Добавить кнопку открытия чата
    - Обновить страницу gig detail
    - Добавить кнопку "AI Помощник" или иконку чата
    - Состояние isOpen для панели
    - _Requirements: 8.1_

  - [x] 8.2 Подключить tRPC hooks
    - useMutation для sendMessage
    - useQuery для getHistory
    - Обработка loading и error состояний
    - _Requirements: 10.1, 10.2_

  - [x] 8.3 Реализовать отправку сообщений
    - Оптимистичное добавление user message
    - Показ typing indicator
    - Добавление AI response после получения
    - Обновление quickReplies
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 9. Checkpoint - UI готов
  - Убедиться что все тесты проходят
  - Проверить UI в браузере
  - Спросить пользователя если есть вопросы

- [x] 10. Реализовать обработку ошибок
  - [x] 10.1 Добавить error handling в UI
    - Toast уведомления для ошибок
    - Retry кнопка при ошибке генерации
    - Сообщение при rate limit
    - _Requirements: 11.1, 11.4_

  - [x] 10.2 Обработать edge cases
    - Gig без кандидатов - показать подсказку
    - Пустая история - показать welcome message
    - _Requirements: 11.2_

- [x] 11. Добавить Langfuse трейсинг
  - [x] 11.1 Настроить трейсинг в sendMessage
    - Создать trace с metadata (workspaceId, gigId, userId)
    - Логировать token usage
    - Логировать latency
    - generationName: "gig-ai-chat"
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 12. Финальный checkpoint
  - Убедиться что все тесты проходят
  - Проверить полный flow в браузере
  - Спросить пользователя если есть вопросы

## Notes

- Задачи с `*` являются опциональными (тесты)
- Каждая задача ссылается на конкретные требования
- Checkpoints позволяют валидировать прогресс
- Property tests используют fast-check библиотеку
