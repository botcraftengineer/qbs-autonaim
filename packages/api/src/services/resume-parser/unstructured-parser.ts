/**
 * Unstructured Document Parser
 *
 * Универсальный парсер документов через Unstructured API.
 * Поддерживает PDF, DOCX и другие форматы.
 */

import type { FormatParser } from "./types";
import { ResumeParserError } from "./types";

/**
 * Конфигурация Unstructured API
 */
interface UnstructuredConfig {
  /** URL Unstructured API сервиса */
  apiUrl: string;
  /** API ключ (опционально для локального Docker) */
  apiKey?: string;
  /** Таймаут запроса в миллисекундах */
  timeout?: number;
}

/**
 * Ответ от Unstructured API
 */
interface UnstructuredElement {
  type: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Универсальный парсер через Unstructured API
 */
export class UnstructuredParser implements FormatParser {
  private readonly config: Required<UnstructuredConfig>;

  constructor(config: UnstructuredConfig) {
    this.config = {
      apiUrl: config.apiUrl,
      apiKey: config.apiKey || "",
      timeout: config.timeout || 30000,
    };
  }

  /**
   * Извлекает текст из документа любого поддерживаемого формата
   *
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (используется для определения типа)
   * @returns Извлечённый текст
   * @throws ResumeParserError если файл не читается или API недоступен
   */
  async extractText(content: Buffer, filename?: string): Promise<string> {
    try {
      const formData = new FormData();

      // Создаём Blob из Buffer через копирование в новый Uint8Array
      const uint8Array = new Uint8Array(content);
      const blob = new Blob([uint8Array], {
        type: this.getMimeType(filename),
      });

      formData.append("files", blob, filename || "document");

      // Настройки для Unstructured API
      formData.append("strategy", "auto");
      formData.append("output_format", "application/json");

      const headers: Record<string, string> = {};
      if (this.config.apiKey) {
        headers["unstructured-api-key"] = this.config.apiKey;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      try {
        const response = await fetch(
          `${this.config.apiUrl}/general/v0/general`,
          {
            method: "POST",
            headers,
            body: formData,
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "");
          throw new Error(
            `Unstructured API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`,
          );
        }

        const elements = (await response.json()) as UnstructuredElement[];

        // Извлекаем текст из всех элементов
        const text = elements
          .filter((el) => el.text?.trim())
          .map((el) => el.text.trim())
          .join("\n\n");

        if (!text) {
          throw new ResumeParserError(
            "EMPTY_CONTENT",
            "Документ не содержит текста. Возможно, это отсканированный документ без OCR.",
          );
        }

        return text;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new ResumeParserError(
            "PARSE_FAILED",
            "Превышено время ожидания обработки документа",
            { timeout: this.config.timeout },
          );
        }

        throw error;
      }
    } catch (error) {
      // Если это уже наша ошибка, пробрасываем дальше
      if (error instanceof ResumeParserError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Проверяем доступность сервиса
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        throw new ResumeParserError(
          "PARSE_FAILED",
          "Сервис обработки документов недоступен. Проверьте, что Docker контейнер unstructured запущен.",
          { originalError: errorMessage, apiUrl: this.config.apiUrl },
        );
      }

      throw new ResumeParserError(
        "CORRUPTED_FILE",
        "Не удалось прочитать документ. Файл может быть повреждён или защищён паролем.",
        { originalError: errorMessage },
      );
    }
  }

  /**
   * Определяет MIME тип по имени файла
   */
  private getMimeType(filename?: string): string {
    if (!filename) return "application/octet-stream";

    const ext = filename.toLowerCase().split(".").pop();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      txt: "text/plain",
      rtf: "application/rtf",
      odt: "application/vnd.oasis.opendocument.text",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
