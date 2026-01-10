import type { TextChunk } from "../types";

/**
 * Configuration for text chunking
 */
export interface ChunkingConfig {
  /** Размер чанка в символах */
  chunkSize: number;
  /** Перекрытие между чанками в символах */
  chunkOverlap: number;
}

/**
 * Utility for chunking text with overlap
 * Разбивает текст на чанки с заданным размером и перекрытием
 */
export class TextChunker {
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(config: ChunkingConfig) {
    if (config.chunkSize <= 0) {
      throw new Error("chunkSize must be greater than 0");
    }
    if (config.chunkOverlap < 0) {
      throw new Error("chunkOverlap must be non-negative");
    }
    if (config.chunkOverlap >= config.chunkSize) {
      throw new Error("chunkOverlap must be less than chunkSize");
    }

    this.chunkSize = config.chunkSize;
    this.chunkOverlap = config.chunkOverlap;
  }

  /**
   * Разбивает текст на чанки с overlap
   * @param text - Исходный текст для разбиения
   * @returns Массив чанков с метаданными
   */
  chunk(text: string): TextChunk[] {
    if (!text || text.length === 0) {
      return [];
    }

    const chunks: TextChunk[] = [];
    const step = this.chunkSize - this.chunkOverlap;
    let index = 0;

    for (let startOffset = 0; startOffset < text.length; startOffset += step) {
      const endOffset = Math.min(startOffset + this.chunkSize, text.length);
      const chunkText = text.slice(startOffset, endOffset);

      chunks.push({
        text: chunkText,
        index,
        startOffset,
        endOffset,
      });

      index++;

      // Если достигли конца текста, выходим
      if (endOffset >= text.length) {
        break;
      }
    }

    return chunks;
  }
}
