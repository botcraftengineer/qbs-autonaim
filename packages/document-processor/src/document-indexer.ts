import type { IndexerConfig, SearchOptions, SearchResult } from "./types";

/**
 * Main orchestrator for document indexing
 * Coordinates parsing, embedding, and storage
 */
export class DocumentIndexer {
  constructor(private config: IndexerConfig) {}

  /**
   * Индексирует документ
   */
  async index(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Переиндексирует документ (удаляет старые эмбеддинги)
   */
  async reindex(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Удаляет документ из индекса
   */
  async remove(documentId: string): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Семантический поиск по документам
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }
}
