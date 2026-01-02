/**
 * PDF Resume Parser
 *
 * Извлекает текст из PDF файлов резюме с использованием pdf-parse.
 */

import type { FormatParser } from "./types";
import { ResumeParserError } from "./types";

/**
 * Парсер PDF файлов
 */
export class PdfParser implements FormatParser {
  /**
   * Извлекает текст из PDF файла
   *
   * @param content - Содержимое PDF файла в виде Buffer
   * @returns Извлечённый текст
   * @throws ResumeParserError если файл повреждён или не читается
   */
  async extractText(content: Buffer): Promise<string> {
    try {
      // Динамический импорт pdf-parse
      const pdfParse = (await import("pdf-parse")).default;

      const data = await pdfParse(content, {
        // Опции для улучшения извлечения текста
        max: 0, // Без ограничения страниц
      });

      const text = data.text?.trim() || "";

      if (!text) {
        throw new ResumeParserError(
          "EMPTY_CONTENT",
          "PDF файл не содержит текста. Возможно, это отсканированный документ.",
          { pagesCount: data.numpages },
        );
      }

      return text;
    } catch (error) {
      // Если это уже наша ошибка, пробрасываем дальше
      if (error instanceof ResumeParserError) {
        throw error;
      }

      // Обрабатываем ошибки pdf-parse
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      throw new ResumeParserError(
        "CORRUPTED_FILE",
        "Не удалось прочитать PDF файл. Файл может быть повреждён или защищён паролем.",
        { originalError: errorMessage },
      );
    }
  }
}
