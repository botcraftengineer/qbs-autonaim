# Implementation Plan: Document Processing Migration

## Overview

Миграция системы обработки документов с Unstructured API на LlamaIndex + Docling + pgvector. Реализация в виде отдельного пакета `@qbs-autonaim/document-processor` для модульности и переиспользования.

## Tasks

- [x] 1. Создание пакета и настройка инфраструктуры
  - [x] 1.1 Создать структуру packages/document-processor
    - Создать package.json с зависимостями
    - Настроить TypeScript конфигурацию
    - Создать базовую структуру папок (src/parsers, src/embeddings, src/vector-store)
    - _Requirements: 5.1, 7.1_
  - [x] 1.2 Добавить зависимости в packages/document-processor
    - Установить `llamaindex`, `docling`, `pgvector`, `fast-check`
    - Добавить зависимости на `@qbs-autonaim/db`, `@qbs-autonaim/validators`
    - _Requirements: 5.1, 7.1_
  - [x] 1.3 Создать Drizzle схему для document_embeddings в @qbs-autonaim/db
    - Создать таблицу с pgvector extension
    - Добавить индексы для поиска
    - Экспортировать схему для использования в document-processor
    - _Requirements: 3.1, 3.2_
  - [x] 1.4 Создать типы и интерфейсы
    - Создать src/types.ts с интерфейсами FormatParser, EmbeddingProvider, VectorStore
    - Добавить типы для конфигурации и результатов
    - _Requirements: 6.1_


- [x] 2. Реализация DoclingProcessor
  - [x] 2.1 Создать src/parsers/docling-processor.ts
    - Реализовать интерфейс FormatParser
    - Добавить extractText и extractStructured методы
    - Поддержка PDF, DOCX форматов
    - _Requirements: 1.1, 1.2, 1.3, 6.1_
  - [x] 2.2 Создать src/parsers/unstructured-parser.ts (legacy)
    - Перенести существующий UnstructuredParser
    - Адаптировать под интерфейс FormatParser
    - _Requirements: 6.2, 6.4_
  - [ ]* 2.3 Написать property test для парсинга документов
    - **Property 1: Document parsing preserves content**
    - **Validates: Requirements 1.1, 1.2, 1.3**
  - [x] 2.4 Добавить обработку ошибок
    - Обработка corrupted/password-protected файлов
    - Структурированные ошибки с кодами
    - _Requirements: 1.5_

- [ ] 3. Checkpoint - Проверка парсинга
  - Убедиться что DoclingProcessor корректно парсит PDF и DOCX
  - Запустить тесты, спросить пользователя при вопросах


- [ ] 4. Реализация EmbeddingService
  - [ ] 4.1 Создать src/embeddings/embedding-service.ts
    - Интеграция с LlamaIndex для эмбеддингов
    - Поддержка OpenAI/Anthropic провайдеров
    - _Requirements: 2.1, 5.4_
  - [ ] 4.2 Реализовать src/embeddings/text-chunker.ts
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
  - [ ] 5.1 Создать src/vector-store/pgvector-store.ts
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


- [ ] 7. Реализация DocumentIndexer (главный API пакета)
  - [ ] 7.1 Создать src/document-indexer.ts
    - Оркестрация: парсинг → эмбеддинг → хранение
    - Методы index, reindex, remove, search
    - Конфигурация через options (parser, embedding provider, feature flags)
    - _Requirements: 5.2, 5.3_
  - [ ]* 7.2 Написать property test для reindex
    - **Property 5: Reindexing replaces embeddings atomically**
    - **Validates: Requirements 3.4**
  - [ ] 7.3 Добавить fallback логику
    - Переключение на UnstructuredParser при ошибках
    - Feature flag для выбора процессора
    - _Requirements: 6.3, 6.4_
  - [ ] 7.4 Создать src/index.ts с экспортами
    - Экспортировать DocumentIndexer, типы, интерфейсы
    - Экспортировать отдельные компоненты для кастомизации
    - _Requirements: 5.1_

- [ ] 8. Интеграция с packages/api
  - [ ] 8.1 Добавить @qbs-autonaim/document-processor в зависимости packages/api
    - Обновить package.json
    - _Requirements: 5.1_
  - [ ] 8.2 Добавить переменные окружения в packages/api
    - Добавить DOCLING_*, EMBEDDING_*, VECTOR_STORE_* в env.ts
    - Добавить feature flag USE_DOCLING_PROCESSOR
    - _Requirements: 7.1, 6.3_
  - [ ] 8.3 Обновить ResumeParserService
    - Использовать DocumentIndexer из @qbs-autonaim/document-processor
    - Сохранить совместимость с существующим API
    - _Requirements: 6.1, 6.2_
  - [ ]* 8.4 Написать property test для эквивалентности парсеров
    - **Property 8: Parser equivalence**
    - **Validates: Requirements 6.2**
  - [ ] 8.5 Добавить метрики и логирование
    - Время обработки, success rate
    - Structured logging с trace ID
    - _Requirements: 7.2, 7.3_

- [ ] 9. Обновление docker-compose
  - [ ] 9.1 Обновить docker-compose.yml
    - Оставить unstructured как fallback
    - Добавить health check
    - _Requirements: 7.4_

- [ ] 10. Final Checkpoint - Полная проверка
  - Запустить все тесты в packages/document-processor
  - Проверить интеграцию с packages/api
  - Спросить пользователя при вопросах

## Notes

- Задачи с `*` опциональны и могут быть пропущены для быстрого MVP
- Каждая задача ссылается на конкретные requirements
- Checkpoints обеспечивают инкрементальную валидацию
- Property tests валидируют универсальные свойства корректности
- Unit tests валидируют конкретные примеры и edge cases

## Package Structure

```
packages/document-processor/
├── src/
│   ├── parsers/
│   │   ├── docling-processor.ts      # Новый парсер на Docling
│   │   ├── unstructured-parser.ts    # Legacy парсер
│   │   └── index.ts
│   ├── embeddings/
│   │   ├── embedding-service.ts      # LlamaIndex интеграция
│   │   ├── text-chunker.ts           # Chunking логика
│   │   └── index.ts
│   ├── vector-store/
│   │   ├── pgvector-store.ts         # pgvector реализация
│   │   └── index.ts
│   ├── document-indexer.ts           # Главный API класс
│   ├── types.ts                      # Интерфейсы и типы
│   └── index.ts                      # Публичные экспорты
├── tests/
│   ├── parsers/
│   ├── embeddings/
│   ├── vector-store/
│   └── integration/
├── package.json
└── tsconfig.json
```

## Benefits

- **Модульность**: Отдельный пакет легко тестировать и поддерживать
- **Переиспользование**: Можно использовать в других приложениях монорепо
- **Изоляция**: Зависимости не загрязняют packages/api
- **Версионирование**: Независимое версионирование функционала
- **Тестирование**: Изолированные тесты без зависимостей от API
