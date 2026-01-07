# Implementation Plan: Document Processing Migration

## Overview

Миграция системы обработки документов с Unstructured API на LlamaIndex + Docling + pgvector. Реализация выполняется поэтапно с сохранением обратной совместимости.

## Tasks

- [ ] 1. Настройка инфраструктуры и зависимостей
  - [ ] 1.1 Добавить зависимости в packages/api
    - Установить `llamaindex`, `docling`, `pgvector`, `fast-check`
    - Обновить package.json
    - _Requirements: 5.1, 7.1_
  - [ ] 1.2 Добавить переменные окружения
    - Добавить DOCLING_*, EMBEDDING_*, VECTOR_STORE_* в env.ts
    - Добавить feature flag USE_DOCLING_PROCESSOR
    - _Requirements: 7.1, 6.3_
  - [ ] 1.3 Создать Drizzle схему для document_embeddings
    - Создать таблицу с pgvector extension
    - Добавить индексы для поиска
    - _Requirements: 3.1, 3.2_

- [ ] 2. Реализация DoclingProcessor
  - [ ] 2.1 Создать DoclingProcessor класс
    - Реализовать интерфейс FormatParser
    - Добавить extractText и extractStructured методы
    - Поддержка PDF, DOCX форматов
    - _Requirements: 1.1, 1.2, 1.3, 6.1_
  - [ ]* 2.2 Написать property test для парсинга документов
    - **Property 1: Document parsing preserves content**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [ ] 2.3 Добавить обработку ошибок
    - Обработка corrupted/password-protected файлов
    - Структурированные ошибки с кодами
    - _Requirements: 1.5_

- [ ] 3. Checkpoint - Проверка парсинга
  - Убедиться что DoclingProcessor корректно парсит PDF и DOCX
  - Запустить тесты, спросить пользователя при вопросах

- [ ] 4. Реализация EmbeddingService
  - [ ] 4.1 Создать EmbeddingService класс
    - Интеграция с LlamaIndex для эмбеддингов
    - Поддержка OpenAI/Anthropic провайдеров
    - _Requirements: 2.1, 5.4_
  - [ ] 4.2 Реализовать text chunking
    - Разбиение текста на чанки с overlap
    - Генерация метаданных для чанков
    - _Requirements: 2.2, 2.3_
  - [ ]* 4.3 Написать property test для chunking
    - **Property 2: Chunking produces valid segments**
    - **Validates: Requirements 2.2, 2.3**
  - [ ] 4.4 Добавить retry логику
    - Exponential backoff при ошибках провайдера
    - _Requirements: 2.4_

- [ ] 5. Реализация VectorStore
  - [ ] 5.1 Создать VectorStore класс
    - Инициализация pgvector таблицы
    - Методы store, deleteByDocument, search
    - _Requirements: 3.1, 3.2, 3.3, 4.1_
  - [ ]* 5.2 Написать property test для round-trip хранения
    - **Property 3: Embedding storage round-trip**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 5.3 Написать property test для удаления
    - **Property 4: Document deletion removes all embeddings**
    - **Validates: Requirements 3.3**
  - [ ] 5.4 Реализовать семантический поиск
    - Top-K поиск с фильтрацией
    - Сортировка по similarity
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [ ]* 5.5 Написать property test для поиска
    - **Property 6: Search results are ordered by similarity**
    - **Property 7: Search filters are applied correctly**
    - **Validates: Requirements 4.1, 4.2, 4.3**

- [ ] 6. Checkpoint - Проверка хранения и поиска
  - Убедиться что эмбеддинги сохраняются и ищутся корректно
  - Запустить тесты, спросить пользователя при вопросах

- [ ] 7. Реализация DocumentIndexer
  - [ ] 7.1 Создать DocumentIndexer класс
    - Оркестрация: парсинг → эмбеддинг → хранение
    - Методы index, reindex, remove, search
    - _Requirements: 5.2, 5.3_
  - [ ]* 7.2 Написать property test для reindex
    - **Property 5: Reindexing replaces embeddings atomically**
    - **Validates: Requirements 3.4**
  - [ ] 7.3 Добавить fallback логику
    - Переключение на UnstructuredParser при ошибках
    - Feature flag для выбора процессора
    - _Requirements: 6.3, 6.4_

- [ ] 8. Интеграция с ResumeParserService
  - [ ] 8.1 Обновить ResumeParserService
    - Добавить поддержку DoclingProcessor
    - Сохранить совместимость с UnstructuredParser
    - _Requirements: 6.1, 6.2_
  - [ ]* 8.2 Написать property test для эквивалентности парсеров
    - **Property 8: Parser equivalence**
    - **Validates: Requirements 6.2**
  - [ ] 8.3 Добавить метрики и логирование
    - Время обработки, success rate
    - Structured logging с trace ID
    - _Requirements: 7.2, 7.3_

- [ ] 9. Обновление docker-compose
  - [ ] 9.1 Обновить docker-compose.yml
    - Оставить unstructured как fallback
    - Добавить health check
    - _Requirements: 7.4_

- [ ] 10. Final Checkpoint - Полная проверка
  - Запустить все тесты
  - Проверить интеграцию с существующим кодом
  - Спросить пользователя при вопросах

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases
