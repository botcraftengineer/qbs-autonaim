/**
 * DOCX Resume Parser
 *
 * Извлекает текст из DOCX файлов резюме с использованием mammoth.
 */

import type { FormatParser } from "./types";
import { ResumeParserError } from "./types";

/**
 * Парсер DOCX файлов
 */
export class DocxParser implements FormatParser {
  /**
   * Извлекает текст из DOCX файла
   *
   * @param content - Содержимое DOCX файла в виде Buffer
   * @returns Извлечённый текст
   * @throws ResumeParserError если файл повреждён или не читается
   */
  async extractText(content: Buffer): Promise<string> {
    try {
      // Динамический импорт mammoth
      const mammoth = await import("mammoth");

      const result = await mammoth.extractRawText({ buffer: content });

      const text = result.value?.trim() || "";

      // Логируем предупреждения mammoth если есть
      if (result.messages && result.messages.length > 0) {
        console.warn(
          "[DocxParser] Mammoth warnings:",
          result.messages.map((m) => m.message),
        );
      }

      if (!text) {
        throw new ResumeParserError(
          "EMPTY_CONTENT",
          "DOCX файл не содержит текста.",
        );
      }

      return text;
    } catch (error) {
      // Если это уже наша ошибка, пробрасываем дальше
      if (error instanceof ResumeParserError) {
        throw error;
      }

      // Обрабатываем ошибки mammoth
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      throw new ResumeParserError(
        "CORRUPTED_FILE",
        "Не удалось прочитать DOCX файл. Файл может быть повреждён.",
        { originalError: errorMessage },
      );
    }
  }
}
