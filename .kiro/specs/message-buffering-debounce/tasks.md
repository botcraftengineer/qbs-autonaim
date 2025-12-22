# Implementation Plan: Message Buffering with Debounce

## Overview

Реализация системы буферизации сообщений с debounce-механизмом через Inngest для интервью-бота. Все задачи будут выполняться на TypeScript с использованием существующей инфраструктуры.

## Tasks

- [x] 1. Настройка инфраструктуры и типов
  - [x] 1.1 Создать схемы Zod для новых Inngest событий
    - Создать `messageBufferedDataSchema` для события `interview/message.buffered`
    - Создать `typingActivityDataSchema` для события `interview/typing.activity`
    - Создать `bufferFlushDataSchema` для события `interview/buffer.flush`
    - Добавить схемы в `packages/jobs/src/inngest/types/index.ts`
    - _Requirements: 2.1, 2.2_
  
  - [x] 1.2 Обновить Inngest клиент с новыми событиями
    - Добавить новые события в EventSchemas в `packages/jobs/src/inngest/client.ts`
    - Экспортировать типы событий
    - _Requirements: 2.1_
  
  - [x] 1.3 Создать TypeScript интерфейсы для буфера
    - Создать `BufferedMessage` interface
    - Создать `BufferValue` interface
    - Создать `MessageBufferService` interface
    - Создать файл `packages/jobs/src/services/buffer/types.ts`
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Реализация Message Buffer Service
  - [x] 2.1 Создать PostgresMessageBufferService класс
    - Реализовать метод `addMessage()` с использованием `getConversationMetadata` и `updateConversationMetadata`
    - Реализовать метод `getMessages()`
    - Реализовать метод `clearBuffer()`
    - Реализовать метод `hasBuffer()`
    - Добавить валидацию пустых сообщений
    - Добавить инициализацию messageBuffer в metadata
    - Создать файл `packages/jobs/src/services/buffer/postgres-buffer-service.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.1_
  
  - [ ]* 2.2 Написать unit тесты для PostgresMessageBufferService
    - Тест добавления сообщения в пустой буфер
    - Тест добавления нескольких сообщений
    - Тест получения сообщений
    - Тест очистки буфера
    - Тест проверки существования буфера
    - Тест отклонения пустых сообщений
    - Создать файл `packages/jobs/src/services/buffer/postgres-buffer-service.test.ts`
    - _Requirements: 1.1, 1.2, 1.3, 8.1_
  
  - [ ]* 2.3 Написать property test для сохранения порядка сообщений
    - **Property 1: Message Ordering Preservation**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Использовать fast-check для генерации массивов сообщений
    - Проверить что порядок сохраняется после добавления и получения
    - Минимум 100 итераций
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 2.4 Написать property test для изоляции буферов
    - **Property 7: Buffer Isolation**
    - **Validates: Requirements 1.4, 1.5**
    - Генерировать разные комбинации userId/conversationId/interviewStep
    - Проверить что буферы не пересекаются
    - Минимум 100 итераций
    - _Requirements: 1.4, 1.5_
  
  - [x] 2.5 Создать экспорты для buffer service
    - Экспортировать `MessageBufferService` interface
    - Экспортировать `PostgresMessageBufferService` класс
    - Создать singleton instance
    - Создать файл `packages/jobs/src/services/buffer/index.ts`
    - _Requirements: 1.1, 1.5_

- [x] 3. Реализация Inngest функций
  - [x] 3.1 Создать Buffer Debounce Function
    - Реализовать функцию с debounce механизмом
    - Настроить debounce key на основе userId + conversationId + interviewStep
    - Настроить period из environment variable
    - Добавить проверку существования буфера
    - Добавить отправку события flush
    - Создать файл `packages/jobs/src/inngest/functions/interview/buffer-debounce.ts`
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 3.2 Создать Typing Activity Handler Function
    - Реализовать функцию с коротким debounce
    - Настроить debounce key аналогично buffer debounce
    - Настроить period меньше основного debounce
    - Добавить логирование активности
    - Создать файл `packages/jobs/src/inngest/functions/interview/typing-activity.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 3.3 Создать Buffer Flush Function
    - Реализовать функцию с idempotency на основе flushId
    - Добавить step для получения сообщений из буфера
    - Добавить step для агрегации сообщений
    - Добавить step для отправки в LLM (интеграция с analyzeAndGenerateNextQuestion)
    - Добавить step для отправки ответа кандидату
    - Добавить step для очистки буфера
    - Добавить обработку пустого буфера
    - Создать файл `packages/jobs/src/inngest/functions/interview/buffer-flush.ts`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_
  
  - [ ]* 3.4 Написать property test для идемпотентности flush
    - **Property 6: Idempotent Flush Operations**
    - **Validates: Requirements 5.1, 5.2**
    - Генерировать flush параметры
    - Вызывать flush функцию несколько раз с одним flushId
    - Проверить что результаты идентичны
    - Проверить что LLM вызван только один раз
    - Минимум 100 итераций
    - _Requirements: 5.1, 5.2_
  
  - [x] 3.5 Добавить функции в inngestFunctions массив
    - Импортировать все три функции
    - Добавить в массив экспорта
    - Обновить файл `packages/jobs/src/inngest/functions/index.ts`
    - _Requirements: 2.1, 3.1, 4.1_

- [ ] 4. Checkpoint - Тестирование Inngest функций
  - Убедиться что все тесты проходят
  - Проверить что функции корректно регистрируются в Inngest
  - Спросить пользователя если возникли вопросы

- [ ] 4.5. Исправление безопасности ключей debounce
  - [ ] 4.5.1 Обновить генерацию debounce ключа в Buffer Debounce Function
    - Заменить конкатенацию через '-' на `JSON.stringify([userId, conversationId, interviewStep])`
    - Обновить файл `packages/jobs/src/inngest/functions/interview/buffer-debounce.ts`
    - Обновить строку 14: заменить `key: "event.data.userId + '-' + event.data.conversationId + '-' + event.data.interviewStep"` на безопасный вариант
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 4.5.2 Обновить генерацию flushId в Buffer Debounce Function
    - Заменить конкатенацию через '-' на `JSON.stringify([userId, conversationId, interviewStep, Date.now()])`
    - Обновить файл `packages/jobs/src/inngest/functions/interview/buffer-debounce.ts`
    - Обновить строку 62: заменить `const flushId = \`${userId}-${conversationId}-${interviewStep}-${Date.now()}\`` на безопасный вариант
    - _Requirements: 9.5, 9.6_
  
  - [ ] 4.5.3 Обновить генерацию debounce ключа в Typing Activity Handler
    - Заменить конкатенацию через '-' на `JSON.stringify([userId, conversationId, interviewStep])`
    - Обновить файл `packages/jobs/src/inngest/functions/interview/typing-activity.ts`
    - Использовать тот же безопасный формат что и в buffer-debounce
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 4.5.4 Написать property test для безопасности ключей
    - **Property 11: Collision-Free Key Generation**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6**
    - Генерировать разные комбинации параметров с разделителями
    - Проверить уникальность ключей
    - Проверить детерминированность
    - Проверить корректность парсинга
    - Минимум 100 итераций
    - Создать файл `packages/jobs/src/inngest/functions/interview/key-generation.test.ts`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 5. Интеграция с Telegram handler
  - [x] 5.1 Создать helper функцию для определения interview step
    - Реализовать `getCurrentInterviewStep(conversationId)`
    - Использовать существующую функцию `getQuestionCount`
    - Создать файл `packages/tg-client/src/utils/interview-helpers.ts`
    - _Requirements: 7.2_
  
  - [x] 5.2 Модифицировать обработчик входящих сообщений
    - ✅ Создан `packages/tg-client/src/handlers/message-handler.ts` с функцией `handleIncomingMessage()`
    - ✅ Добавлен вызов `messageBufferService.addMessage()` с получением questionContext из metadata
    - ✅ Добавлена отправка события `interview/message.buffered` в Inngest
    - ✅ Добавлена интеграция в `packages/jobs/src/inngest/functions/telegram/process-incoming-message.ts`
    - ✅ Добавлены экспорты в `packages/jobs/src/index.ts` и `packages/jobs/package.json`
    - ✅ Добавлены экспорты в `packages/tg-client/src/index.ts` и `packages/tg-client/package.json`
    - ✅ Feature flag `INTERVIEW_BUFFER_ENABLED` уже добавлен в `packages/config/src/env.ts`
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [ ] 5.2.1 Исправить экспорты message-handler в package.json
    - Обновить `packages/tg-client/package.json` строки 14-17
    - Изменить `"types"` с `"./src/handlers/message-handler.ts"` на `"./dist/handlers/message-handler.d.mts"`
    - Изменить `"default"` с `"./src/handlers/message-handler.ts"` на `"./dist/handlers/message-handler.mjs"`
    - Убедиться что build script компилирует message-handler в dist
    - Проверить что tsconfig/outDir настроен корректно
    - Проверить что файлы `dist/handlers/message-handler.mjs` и `dist/handlers/message-handler.d.mts` создаются при сборке
    - _Requirements: 7.1, 7.3_
  
  - [ ] 5.2.2 Добавить таймаут и валидацию для HTTP-запроса к Inngest
    - Обновить `packages/tg-client/src/handlers/message-handler.ts` строки 157-172
    - Создать AbortController для установки таймаута (5-10 секунд)
    - Обернуть fetch в try-catch для обработки сетевых ошибок
    - После await fetch проверить response.ok или response.status
    - Логировать или выбрасывать описательную ошибку если ответ не успешный
    - Убедиться что сбои не игнорируются молча
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_
  
  - [ ] 5.3 Создать обработчик typing событий
    - Подписаться на mtproto typing события
    - Подписаться на mtproto recording события
    - Отправлять события `interview/typing.activity` в Inngest
    - Создать файл `packages/tg-client/src/handlers/typing-handler.ts`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 5.4 Добавить feature flag для буферизации
    - ✅ Добавлен `INTERVIEW_BUFFER_ENABLED` в env config (уже был добавлен ранее)
    - ✅ Добавлена условная логика в message handler
    - ✅ Реализован fallback на старую логику если флаг выключен
    - ✅ Обновлен `packages/config/src/env.ts`
    - _Requirements: 7.1, 7.3_

- [ ] 6. Обработка ошибок и edge cases
  - [ ] 6.1 Добавить обработку PostgreSQL failures
    - Добавить try-catch в PostgresMessageBufferService методы
    - Добавить логирование ошибок
    - Добавить fallback на прямой вызов LLM
    - Добавить retry логику с exponential backoff
    - _Requirements: 8.3_
  
  - [ ] 6.2 Добавить обработку Inngest unavailability
    - Добавить try-catch при отправке событий
    - Добавить fallback на прямой вызов LLM
    - Добавить логирование критических ошибок
    - _Requirements: 8.4_
  
  - [ ] 6.3 Добавить обработку buffer overflow
    - Добавить проверку размера буфера в addMessage
    - Добавить принудительный flush при превышении лимита
    - Добавить логирование аномалий
    - _Requirements: 8.5_
  
  - [ ] 6.4 Добавить обработку concurrent messages
    - Добавить логику создания нового буфера при flush
    - Добавить проверку статуса flush перед добавлением
    - _Requirements: 8.2_

- [ ] 7. Конфигурация и мониторинг
  - [-] 7.1 Добавить environment variables
    - ✅ Добавлен `INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT` (уже был добавлен ранее)
    - ✅ Добавлен `INTERVIEW_TYPING_DEBOUNCE_TIMEOUT` (уже был добавлен ранее)
    - ✅ Добавлен `INTERVIEW_BUFFER_ENABLED` (уже был добавлен ранее)
    - [ ] Добавить `INTERVIEW_BUFFER_MAX_SIZE`
    - Обновить `packages/config/src/env.ts`
    - _Requirements: 6.1, 6.2_
  
  - [ ] 7.2 Добавить логирование метрик
    - Логировать время ожидания буфера
    - Логировать количество сообщений в буфере
    - Логировать успешность flush операций
    - Логировать ошибки
    - Добавить в существующий logger
    - _Requirements: 6.2, 6.3, 6.4, 6.5_
  
  - [ ] 7.3 Создать utility для генерации flushId
    - Реализовать детерминированную генерацию на основе параметров
    - Добавить в `packages/jobs/src/services/buffer/utils.ts`
    - _Requirements: 5.1_

- [ ] 8. Checkpoint - Интеграционное тестирование
  - Убедиться что все компоненты работают вместе
  - Проверить полный flow: сообщение → буфер → debounce → flush → LLM
  - Спросить пользователя если возникли вопросы

- [ ]* 9. Property-based тесты для edge cases
  - [ ]* 9.1 Написать property test для отклонения пустых сообщений
    - **Property 8: Empty Message Rejection**
    - **Validates: Requirements 8.1**
    - Генерировать массивы пустых/whitespace строк
    - Проверить что буфер остается пустым
    - Минимум 100 итераций
    - _Requirements: 8.1_
  
  - [ ]* 9.2 Написать property test для typing events
    - **Property 3: Typing Event Non-Flush**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
    - Генерировать последовательности typing событий
    - Проверить что flush не вызывается
    - Минимум 100 итераций
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 10. Integration тесты
  - [ ]* 10.1 Написать end-to-end тест полного flow
    - Создать mock Telegram сообщения
    - Проверить добавление в буфер
    - Проверить debounce behavior
    - Проверить flush и вызов LLM
    - Проверить очистку буфера
    - _Requirements: 1.1, 2.1, 4.1, 4.4_
  
  - [ ]* 10.2 Написать тест для typing events
    - Отправить typing событие
    - Проверить что debounce продлевается
    - Проверить что flush не вызывается
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 10.3 Написать тест для множественных сообщений
    - Отправить несколько сообщений подряд
    - Проверить агрегацию
    - Проверить что LLM вызван один раз
    - _Requirements: 4.2, 4.3_

- [ ] 11. Финальный checkpoint
  - Убедиться что все тесты проходят
  - Проверить что feature flag работает корректно
  - Проверить логирование и мониторинг
  - Спросить пользователя о готовности к деплою

## Notes

- Задачи с `*` являются опциональными и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные требования для трассируемости
- Property тесты используют fast-check с минимум 100 итерациями
- Unit тесты и property тесты дополняют друг друга
- Checkpoints обеспечивают инкрементальную валидацию
- Feature flag позволяет безопасный rollout
