import { QdrantClient } from "@qdrant/js-client-rest";
import type {
  EmbeddingResult,
  SearchOptions,
  SearchResult,
  VectorStore,
  VectorStoreConfig,
} from "../types";

/**
 * Vector store implementation using Qdrant
 */
export class QdrantVectorStore implements VectorStore {
  private client: QdrantClient;
  private collectionName: string;

  constructor(private config: VectorStoreConfig) {
    this.client = new QdrantClient({
      url: config.url,
      apiKey: config.apiKey,
    });
    this.collectionName = config.collectionName;
  }

  /**
   * Инициализирует коллекцию и индексы
   */
  async initialize(): Promise<void> {
    try {
      // Проверяем существование коллекции
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        // Создаём коллекцию с косинусной метрикой
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.config.dimensions,
            distance: "Cosine",
          },
          optimizers_config: {
            default_segment_number: 2,
          },
          replication_factor: 1,
        });

        // Создаём индекс для быстрого поиска по documentId
        await this.client.createPayloadIndex(this.collectionName, {
          field_name: "documentId",
          field_schema: "keyword",
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to initialize Qdrant collection: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Сохраняет эмбеддинги
   */
  async store(
    result: EmbeddingResult,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    try {
      const points = result.chunks.map((item) => ({
        id: `${result.documentId}_${item.chunk.index}`,
        vector: item.embedding,
        payload: {
          documentId: result.documentId,
          chunkIndex: item.chunk.index,
          chunkText: item.chunk.text,
          startOffset: item.chunk.startOffset,
          endOffset: item.chunk.endOffset,
          metadata: metadata || {},
          createdAt: new Date().toISOString(),
        },
      }));

      await this.client.upsert(this.collectionName, {
        wait: true,
        points,
      });
    } catch (error) {
      throw new Error(
        `Failed to store embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Удаляет эмбеддинги документа
   */
  async deleteByDocument(documentId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        wait: true,
        filter: {
          must: [
            {
              key: "documentId",
              match: { value: documentId },
            },
          ],
        },
      });
    } catch (error) {
      throw new Error(
        `Failed to delete embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Семантический поиск
   */
  async search(
    queryEmbedding: number[],
    options: SearchOptions,
  ): Promise<SearchResult[]> {
    try {
      const filter: Record<string, unknown> = { must: [] };

      // Применяем фильтры
      if (
        options.filter?.documentIds &&
        options.filter.documentIds.length > 0
      ) {
        (filter.must as Array<Record<string, unknown>>).push({
          key: "documentId",
          match: { any: options.filter.documentIds },
        });
      }

      if (options.filter?.candidateId) {
        (filter.must as Array<Record<string, unknown>>).push({
          key: "metadata.candidateId",
          match: { value: options.filter.candidateId },
        });
      }

      if (options.filter?.dateFrom) {
        (filter.must as Array<Record<string, unknown>>).push({
          key: "createdAt",
          range: { gte: options.filter.dateFrom.toISOString() },
        });
      }

      if (options.filter?.dateTo) {
        (filter.must as Array<Record<string, unknown>>).push({
          key: "createdAt",
          range: { lte: options.filter.dateTo.toISOString() },
        });
      }

      const searchResult = await this.client.search(this.collectionName, {
        vector: queryEmbedding,
        limit: options.topK,
        score_threshold: options.threshold,
        filter:
          (filter.must as Array<Record<string, unknown>>).length > 0
            ? filter
            : undefined,
        with_payload: true,
      });

      return searchResult.map((point) => ({
        documentId: point.payload?.documentId as string,
        chunkText: point.payload?.chunkText as string,
        chunkIndex: point.payload?.chunkIndex as number,
        similarity: point.score,
        metadata: (point.payload?.metadata as Record<string, unknown>) || {},
      }));
    } catch (error) {
      throw new Error(
        `Failed to search embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
