import type {
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingResult,
} from "../types";
import { DocumentProcessingError, DocumentProcessingErrorCode } from "../types";
import { DEFAULT_RETRY_CONFIG, type RetryConfig, withRetry } from "./retry";
import { TextChunker } from "./text-chunker";

/**
 * Configuration for EmbeddingService
 */
export interface EmbeddingServiceConfig extends EmbeddingConfig {
  /** Конфигурация retry логики */
  retry?: RetryConfig;
  /** API ключ для провайдера */
  apiKey?: string;
}

/**
 * Service for generating embeddings using LlamaIndex
 * Поддерживает различные провайдеры (OpenAI, Anthropic, local)
 */
export class EmbeddingService implements EmbeddingProvider {
  private readonly chunker: TextChunker;
  private readonly retryConfig: RetryConfig;
  private readonly config: EmbeddingServiceConfig;

  constructor(config: EmbeddingServiceConfig) {
    this.config = config;
    this.retryConfig = config.retry || DEFAULT_RETRY_CONFIG;

    // Инициализация chunker
    this.chunker = new TextChunker({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
  }

  /**
   * Генерирует эмбеддинги для текста используя провайдер API
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = this.config.apiKey || process.env.OPENAI_API_KEY || "";

    if (!apiKey) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
        "API key not configured",
      );
    }

    // Используем OpenAI API для генерации эмбеддингов
    // В будущем можно добавить поддержку других провайдеров
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
        model: this.config.model,
        dimensions: this.config.dimensions,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Проверяем на rate limiting
      if (response.status === 429) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.RATE_LIMITED,
          `Rate limit exceeded: ${errorText}`,
        );
      }

      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
        `OpenAI API error: ${response.status} - ${errorText}`,
      );
    }

    const data = (await response.json()) as {
      data: Array<{ embedding: number[] }>;
    };

    const embedding = data.data[0]?.embedding;
    if (!embedding) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
        "No embedding returned from API",
      );
    }

    return embedding;
  }

  /**
   * Генерирует эмбеддинги для текста
   * Разбивает текст на чанки и генерирует эмбеддинг для каждого
   */
  async embed(text: string, documentId: string): Promise<EmbeddingResult> {
    if (!text || text.trim().length === 0) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.INVALID_INPUT,
        "Text cannot be empty",
      );
    }

    // Разбиваем текст на чанки
    const chunks = this.chunker.chunk(text);

    // Генерируем эмбеддинги для каждого чанка с retry логикой
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const embedding = await withRetry(
            async () => await this.generateEmbedding(chunk.text),
            this.retryConfig,
          );
          return {
            chunk,
            embedding,
          };
        } catch (error) {
          // Преобразуем ошибку в DocumentProcessingError
          if (error instanceof DocumentProcessingError) {
            throw error;
          }
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
            `Failed to generate embedding for chunk ${chunk.index}: ${error instanceof Error ? error.message : String(error)}`,
            { chunkIndex: chunk.index, documentId },
          );
        }
      }),
    );

    return {
      documentId,
      chunks: chunksWithEmbeddings,
    };
  }

  /**
   * Генерирует эмбеддинг для поискового запроса
   * Используется для семантического поиска
   */
  async embedQuery(query: string): Promise<number[]> {
    if (!query || query.trim().length === 0) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.INVALID_INPUT,
        "Query cannot be empty",
      );
    }

    try {
      return await withRetry(
        async () => await this.generateEmbedding(query),
        this.retryConfig,
      );
    } catch (error) {
      // Преобразуем ошибку в DocumentProcessingError
      if (error instanceof DocumentProcessingError) {
        throw error;
      }
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
        `Failed to generate query embedding: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
