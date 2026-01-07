# Requirements Document

## Introduction

Миграция системы обработки документов с текущего решения на базе Unstructured API на новый стек: LlamaIndex + Docling + pgvector + LLM. Это позволит улучшить качество парсинга документов, добавить семантический поиск по содержимому резюме и снизить зависимость от внешних сервисов.

## Glossary

- **Document_Processor**: Сервис обработки документов, заменяющий текущий UnstructuredParser
- **Docling**: Библиотека IBM для парсинга PDF и других документов с высоким качеством извлечения структуры
- **LlamaIndex**: Фреймворк для построения RAG-приложений с поддержкой различных источников данных
- **pgvector**: Расширение PostgreSQL для хранения и поиска векторных эмбеддингов
- **Embedding_Service**: Сервис генерации векторных представлений текста
- **Vector_Store**: Хранилище векторных эмбеддингов на базе pgvector
- **Resume_Parser**: Существующий сервис парсинга резюме, который будет использовать новый Document_Processor

## Requirements

### Requirement 1: Парсинг документов через Docling

**User Story:** As a recruiter, I want to upload resumes in various formats, so that the system can extract text with high accuracy including tables and structured content.

#### Acceptance Criteria

1. WHEN a PDF file is uploaded, THE Document_Processor SHALL extract text content preserving document structure (заголовки, списки, таблицы)
2. WHEN a DOCX file is uploaded, THE Document_Processor SHALL extract text content with formatting metadata
3. WHEN a document contains tables, THE Document_Processor SHALL extract table data in structured format
4. WHEN a scanned PDF is uploaded, THE Document_Processor SHALL apply OCR and extract text
5. IF a document is corrupted or password-protected, THEN THE Document_Processor SHALL return a descriptive error with error code

### Requirement 2: Генерация эмбеддингов

**User Story:** As a system, I want to generate vector embeddings for document content, so that semantic search can be performed.

#### Acceptance Criteria

1. WHEN text is extracted from a document, THE Embedding_Service SHALL generate vector embeddings using configured LLM provider
2. WHEN generating embeddings, THE Embedding_Service SHALL chunk text into segments of configurable size with overlap
3. WHEN embeddings are generated, THE Embedding_Service SHALL return vectors with metadata (chunk index, source document)
4. IF the embedding provider is unavailable, THEN THE Embedding_Service SHALL retry with exponential backoff and return error after max retries

### Requirement 3: Хранение векторов в pgvector

**User Story:** As a system, I want to store document embeddings in PostgreSQL, so that they can be efficiently searched.

#### Acceptance Criteria

1. WHEN embeddings are generated, THE Vector_Store SHALL persist them to PostgreSQL using pgvector extension
2. WHEN storing embeddings, THE Vector_Store SHALL associate them with source document ID and chunk metadata
3. WHEN a document is deleted, THE Vector_Store SHALL remove all associated embeddings
4. WHEN a document is re-processed, THE Vector_Store SHALL replace existing embeddings atomically

### Requirement 4: Семантический поиск

**User Story:** As a recruiter, I want to search resumes by skills and experience description, so that I can find relevant candidates quickly.

#### Acceptance Criteria

1. WHEN a search query is submitted, THE Vector_Store SHALL return top-K most similar document chunks
2. WHEN searching, THE Vector_Store SHALL support filtering by document metadata (date, type, candidate ID)
3. WHEN results are returned, THE Vector_Store SHALL include similarity score and source document reference
4. WHEN no results match the threshold, THE Vector_Store SHALL return empty result set

### Requirement 5: Интеграция с LlamaIndex

**User Story:** As a developer, I want to use LlamaIndex for document indexing and retrieval, so that I can leverage its RAG capabilities.

#### Acceptance Criteria

1. WHEN initializing the system, THE Document_Processor SHALL configure LlamaIndex with Docling reader
2. WHEN indexing documents, THE Document_Processor SHALL use LlamaIndex pipeline for chunking and embedding
3. WHEN querying, THE Document_Processor SHALL use LlamaIndex retriever with pgvector backend
4. WHEN the LLM provider changes, THE Document_Processor SHALL support configuration switch without code changes

### Requirement 6: Обратная совместимость

**User Story:** As a developer, I want the new system to maintain the same API interface, so that existing code continues to work.

#### Acceptance Criteria

1. THE Document_Processor SHALL implement the same FormatParser interface as UnstructuredParser
2. WHEN parsing resumes, THE Resume_Parser SHALL work with both old and new Document_Processor implementations
3. WHEN migrating, THE system SHALL support gradual rollout via feature flag
4. IF the new processor fails, THEN THE system SHALL fallback to Unstructured API (configurable)

### Requirement 7: Конфигурация и мониторинг

**User Story:** As a DevOps engineer, I want to configure and monitor the document processing system, so that I can ensure reliability.

#### Acceptance Criteria

1. THE Document_Processor SHALL read configuration from environment variables
2. WHEN processing documents, THE Document_Processor SHALL emit metrics (processing time, success rate, chunk count)
3. WHEN errors occur, THE Document_Processor SHALL log structured error information with trace ID
4. THE system SHALL expose health check endpoint for document processing service
