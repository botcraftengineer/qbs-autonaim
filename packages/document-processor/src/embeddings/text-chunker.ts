import type { TextChunk } from "../types";

/**
 * Utility for chunking text with overlap
 */
export class TextChunker {
  constructor(
    private chunkSize: number,
    private chunkOverlap: number,
  ) {}

  /**
   * Разбивает текст на чанки с overlap
   */
  chunk(text: string): TextChunk[] {
    // TODO: Implement in task 4.2
    throw new Error("Not implemented yet");
  }
}
