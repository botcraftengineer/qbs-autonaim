import type { SearchOptions, SearchResult } from "./types";

/**
 * Main orchestrator for document indexing
 * Coordinates parsing, embedding, and storage
 */
export class DocumentIndexer {
  /**
   * Индексирует документ
   */
  async index(
    _content: Buffer,
    _documentId: string,
    _metadata?: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Переиндексирует документ (удаляет старые эмбеддинги)
   */
  async reindex(
    _content: Buffer,
    _documentId: string,
    _metadata?: Record<string, unknown>,
  ): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Удаляет документ из индекса
   */
  async remove(_documentId: string): Promise<void> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }

  /**
   * Семантический поиск по документам
   */
  async search(
    _query: string,
    _options: SearchOptions,
  ): Promise<SearchResult[]> {
    // TODO: Implement in task 7.1
    throw new Error("Not implemented yet");
  }
}
