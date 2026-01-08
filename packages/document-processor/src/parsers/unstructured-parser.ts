import {
  DocumentProcessingError,
  DocumentProcessingErrorCode,
  type FormatParser,
} from "../types";

/**
 * Configuration for Unstructured API
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
 * Response element from Unstructured API
 */
interface UnstructuredElement {
  type: string;
  text: string;
  metadata?: Record<string, unknown>;
}

/**
 * Legacy parser using Unstructured API
 * Kept for backward compatibility and fallback
 *
 * Requirements: 6.2, 6.4
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
   * @throws DocumentProcessingError если файл не читается или API недоступен
   *
   * Requirements: 6.2
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

        const parsed = await response.json();

        // Validate response is an array
        if (!Array.isArray(parsed)) {
          console.error(
            "Unstructured API returned non-array response:",
            parsed,
          );
          throw new Error(
            "Invalid response format: expected array of elements",
          );
        }

        // Filter and validate elements
        const elements = parsed.filter(
          (item): item is UnstructuredElement =>
            typeof item === "object" &&
            item !== null &&
            typeof item.text === "string" &&
            item.text.trim() !== "",
        );

        // Извлекаем текст из всех элементов
        const text = elements.map((el) => el.text.trim()).join("\n\n");

        if (!text) {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.EMPTY_CONTENT,
            "Документ не содержит текста. Возможно, это отсканированный документ без OCR.",
          );
        }

        return text;
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.PARSE_TIMEOUT,
            "Превышено время ожидания обработки документа",
            { timeout: this.config.timeout },
          );
        }

        throw error;
      }
    } catch (error) {
      // Если это уже наша ошибка, пробрасываем дальше
      if (error instanceof DocumentProcessingError) {
        throw error;
      }

      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      // Проверяем доступность сервиса
      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("Failed to fetch")
      ) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
          "Сервис обработки документов недоступен. Проверьте, что Docker контейнер unstructured запущен.",
          { originalError: errorMessage, apiUrl: this.config.apiUrl },
        );
      }

      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.CORRUPTED_FILE,
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

    const lastDotIndex = filename.lastIndexOf(".");
    const hasDot = lastDotIndex > -1;
    const ext = hasDot
      ? filename.slice(lastDotIndex + 1).toLowerCase()
      : undefined;

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
      txt: "text/plain",
      rtf: "application/rtf",
      odt: "application/vnd.oasis.opendocument.text",
    };

    return ext && mimeTypes[ext] ? mimeTypes[ext] : "application/octet-stream";
  }
}
