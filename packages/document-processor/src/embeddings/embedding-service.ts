import type {
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingResult,
} from "../types";

/**
 * Service for generating embeddings using LlamaIndex
 */
export class EmbeddingService implements EmbeddingProvider {
  constructor(private config: EmbeddingConfig) {}

  /**
   * Генерирует эмбеддинги для текста
   */
  async embed(text: string, documentId: string): Promise<EmbeddingResult> {
    // TODO: Implement in task 4.1
    throw new Error("Not implemented yet");
  }

  /**
   * Генерирует эмбеддинг для поискового запроса
   */
  async embedQuery(query: string): Promise<number[]> {
    // TODO: Implement in task 4.1
    throw new Error("Not implemented yet");
  }
}
