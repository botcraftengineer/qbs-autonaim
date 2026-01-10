import { db, documentEmbedding } from "@qbs-autonaim/db";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import type {
  EmbeddingResult,
  SearchOptions,
  SearchResult,
  VectorStore,
} from "../types";

/**
 * Vector store implementation using pgvector
 * Хранит векторные эмбеддинги в PostgreSQL с использованием расширения pgvector
 */
export class PgVectorStore implements VectorStore {
  /**
   * Инициализирует pgvector расширение и индексы
   * Требования: 3.1
   */
  async initialize(): Promise<void> {
    try {
      // Включаем расширение pgvector
      await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);

      // Создаём индекс для векторного поиска (IVFFlat)
      // Используем косинусное расстояние для similarity search
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_embeddings_vector 
        ON document_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
      `);

      // Индекс для быстрого поиска по document_id уже создан в схеме
      // Индекс для метаданных (GIN) для фильтрации
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_embeddings_metadata 
        ON document_embeddings 
        USING gin(metadata)
      `);
    } catch (error) {
      throw new Error(
        `Failed to initialize pgvector: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Сохраняет эмбеддинги в базу данных
   * Требования: 3.1, 3.2
   */
  async store(
    result: EmbeddingResult,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const values = result.chunks.map((item) => ({
        documentId: result.documentId,
        chunkIndex: item.chunk.index,
        chunkText: item.chunk.text,
        embedding: item.embedding, // pgvector принимает number[]
        metadata: {
          ...metadata,
          startOffset: item.chunk.startOffset,
          endOffset: item.chunk.endOffset,
        },
      }));

      // Используем upsert для атомарной замены существующих эмбеддингов
      await db
        .insert(documentEmbedding)
        .values(values)
        .onConflictDoUpdate({
          target: [documentEmbedding.documentId, documentEmbedding.chunkIndex],
          set: {
            chunkText: sql`excluded.chunk_text`,
            embedding: sql`excluded.embedding`,
            metadata: sql`excluded.metadata`,
            updatedAt: new Date(),
          },
        });
    } catch (error) {
      throw new Error(
        `Failed to store embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Удаляет все эмбеддинги документа
   * Требования: 3.3
   */
  async deleteByDocument(documentId: string): Promise<void> {
    try {
      await db
        .delete(documentEmbedding)
        .where(eq(documentEmbedding.documentId, documentId));
    } catch (error) {
      throw new Error(
        `Failed to delete embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Семантический поиск по векторам
   * Требования: 4.1, 4.2, 4.3, 4.4
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    try {
      // Строим условия фильтрации
      const conditions = [];

      // Фильтр по documentIds
      if (
        options.filter?.documentIds &&
        options.filter.documentIds.length > 0
      ) {
        conditions.push(
          inArray(documentEmbedding.documentId, options.filter.documentIds),
        );
      }

      // Фильтр по candidateId в метаданных
      if (options.filter?.candidateId) {
        conditions.push(
          sql`${documentEmbedding.metadata}->>'candidateId' = ${options.filter.candidateId}`,
        );
      }

      // Фильтр по дате создания (от)
      if (options.filter?.dateFrom) {
        conditions.push(
          gte(documentEmbedding.createdAt, options.filter.dateFrom),
        );
      }

      // Фильтр по дате создания (до)
      if (options.filter?.dateTo) {
        conditions.push(
          lte(documentEmbedding.createdAt, options.filter.dateTo),
        );
      }

      // Вычисляем косинусное расстояние и конвертируем в similarity (1 - distance)
      const similarityExpr = sql<number>`1 - (${documentEmbedding.embedding} <=> ${sql.raw(`'[${queryEmbedding.join(",")}]'`)}::vector)`;

      // Строим запрос с фильтрацией и сортировкой по similarity
      let query = db
        .select({
          documentId: documentEmbedding.documentId,
          chunkText: documentEmbedding.chunkText,
          chunkIndex: documentEmbedding.chunkIndex,
          metadata: documentEmbedding.metadata,
          similarity: similarityExpr,
        })
        .from(documentEmbedding)
        .$dynamic();

      // Применяем фильтры
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Применяем порог similarity если указан
      if (options.threshold !== undefined) {
        query = query.having(sql`${similarityExpr} >= ${options.threshold}`);
      }

      // Сортируем по similarity (DESC) и ограничиваем количество результатов
      const results = await query
        .orderBy(desc(similarityExpr))
        .limit(options.topK);

      return results.map((row) => ({
        documentId: row.documentId,
        chunkText: row.chunkText,
        chunkIndex: row.chunkIndex,
        similarity: row.similarity,
        metadata: (row.metadata as Record<string, unknown>) || {},
      }));
    } catch (error) {
      throw new Error(
        `Failed to search embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
