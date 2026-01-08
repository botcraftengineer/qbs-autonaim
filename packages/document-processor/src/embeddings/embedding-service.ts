import type { EmbeddingProvider, EmbeddingResult } from "../types";

/**
 * Service for generating embeddings using LlamaIndex
 */
export class EmbeddingService implements EmbeddingProvider {
  /**
   * Генерирует эмбеддинги для текста
   */
  async embed(_text: string, _documentId: string): Promise<EmbeddingResult> {
    // TODO: Implement in task 4.1
    throw new Error("Not implemented yet");
  }

  /**
   * Генерирует эмбеддинг для поискового запроса
   */
  async embedQuery(_query: string): Promise<number[]> {
    // TODO: Implement in task 4.1
    throw new Error("Not implemented yet");
  }
}
