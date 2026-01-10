# Миграция на Qdrant

Проект переведён с pgvector на Qdrant для хранения векторных эмбеддингов документов.

## Изменения

### Удалено
- Таблица `document_embeddings` из PostgreSQL
- Схема `packages/db/src/schema/document/document-embedding.ts`
- Миграция `packages/db/drizzle/0009_bitter_sleeper.sql`
- `packages/document-processor/src/vector-store/pgvector-store.ts`

### Добавлено
- Qdrant сервис в `docker-compose.yml`
- Переменные окружения для Qdrant в `.env.example`:
  - `QDRANT_URL` (default: `http://localhost:6333`)
  - `QDRANT_API_KEY` (опционально)
  - `QDRANT_COLLECTION_NAME` (default: `document_embeddings`)

### Изменено
- `DocumentIndexer` теперь использует `QdrantVectorStore` вместо `PgVectorStore`
- Экспорты в `packages/document-processor/src/index.ts`
- Конфигурация в `packages/config/src/env.ts`

## Запуск

```bash
# Запустить Qdrant
docker-compose up -d qdrant

# Проверить статус
curl http://localhost:6333/healthz
```

## Структура данных в Qdrant

Коллекция `document_embeddings` содержит:

**Векторы:**
- Размерность: 1536 (text-embedding-3-small)
- Метрика: Cosine

**Payload:**
```json
{
  "documentId": "string",
  "chunkIndex": 0,
  "chunkText": "string",
  "startOffset": 0,
  "endOffset": 100,
  "metadata": {},
  "createdAt": "2026-01-10T..."
}
```

**Индексы:**
- `documentId`: keyword index для быстрого поиска по документу
