import {
  type DoclingConfig,
  type DoclingResult,
  type DocumentElement,
  DocumentProcessingError,
  DocumentProcessingErrorCode,
  type FormatParser,
} from "../types";

/**
 * Configuration for Docling service
 */
interface DoclingServiceConfig extends DoclingConfig {
  /** URL Docling service API */
  apiUrl?: string;
  /** API ключ (если требуется) */
  apiKey?: string;
}

/**
 * Response from Docling service
 */
interface DoclingServiceResponse {
  text: string;
  metadata?: {
    page_count?: number;
    title?: string;
    author?: string;
    created_at?: string;
  };
  elements?: Array<{
    type: string;
    content: string;
    level?: number;
    rows?: string[][];
  }>;
}

/**
 * Document processor using Docling library
 * Provides high-quality parsing of PDF and DOCX files
 *
 * Requirements: 1.1, 1.2, 1.3, 6.1
 */
export class DoclingProcessor implements FormatParser {
  private readonly config: Required<DoclingServiceConfig>;

  constructor(config?: DoclingServiceConfig) {
    this.config = {
      apiUrl:
        config?.apiUrl ||
        process.env.DOCLING_API_URL ||
        "http://localhost:8000",
      apiKey: config?.apiKey || process.env.DOCLING_API_KEY || "",
      timeout: config?.timeout || 30000,
      enableOcr: config?.enableOcr ?? true,
      ocrLanguage: config?.ocrLanguage || "auto",
    };
  }

  /**
   * Извлекает текст из документа (совместимость с FormatParser)
   *
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (используется для определения типа)
   * @returns Извлечённый текст
   * @throws DocumentProcessingError если файл не читается или сервис недоступен
   *
   * Requirements: 1.1, 1.2, 6.1
   */
  async extractText(content: Buffer, filename?: string): Promise<string> {
    const result = await this.extractStructured(content, filename);
    return result.text;
  }

  /**
   * Извлекает структурированный результат
   *
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (используется для определения типа)
   * @returns Структурированный результат парсинга
   * @throws DocumentProcessingError если файл не читается или сервис недоступен
   *
   * Requirements: 1.1, 1.2, 1.3
   */
  async extractStructured(
    content: Buffer,
    filename?: string,
  ): Promise<DoclingResult> {
    try {
      // Validate file format
      this.validateFormat(filename);

      // Prepare form data
      const formData = new FormData();
      // Convert Buffer to Uint8Array for Blob
      const uint8Array = new Uint8Array(content);
      const blob = new Blob([uint8Array], {
        type: this.getMimeType(filename),
      });
      formData.append("file", blob, filename || "document");

      // Add configuration options
      if (this.config.enableOcr) {
        formData.append("enable_ocr", "true");
        formData.append("ocr_language", this.config.ocrLanguage);
      }

      // Setup request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.timeout,
      );

      try {
        const headers: Record<string, string> = {};
        if (this.config.apiKey) {
          headers.Authorization = `Bearer ${this.config.apiKey}`;
        }

        const response = await fetch(`${this.config.apiUrl}/parse`, {
          method: "POST",
          headers,
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          await this.handleErrorResponse(response);
        }

        const data = (await response.json()) as DoclingServiceResponse;

        // Validate response has content
        if (!data.text || data.text.trim().length === 0) {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.EMPTY_CONTENT,
            "Документ не содержит текста. Возможно, это отсканированный документ без текстового слоя.",
            { filename },
          );
        }

        // Convert response to DoclingResult
        return this.convertResponse(data);
      } catch (error) {
        clearTimeout(timeoutId);

        if (error instanceof Error && error.name === "AbortError") {
          throw new DocumentProcessingError(
            DocumentProcessingErrorCode.PARSE_TIMEOUT,
            `Превышено время ожидания обработки документа (${this.config.timeout}ms)`,
            { timeout: this.config.timeout, filename },
          );
        }

        throw error;
      }
    } catch (error) {
      // Re-throw DocumentProcessingError as-is
      if (error instanceof DocumentProcessingError) {
        throw error;
      }

      // Handle network errors
      const errorMessage =
        error instanceof Error ? error.message : "Неизвестная ошибка";

      if (
        errorMessage.includes("fetch") ||
        errorMessage.includes("ECONNREFUSED") ||
        errorMessage.includes("Failed to fetch")
      ) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE,
          "Сервис Docling недоступен. Проверьте, что сервис запущен и доступен.",
          { originalError: errorMessage, apiUrl: this.config.apiUrl },
        );
      }

      // Generic error
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.CORRUPTED_FILE,
        "Не удалось обработать документ. Файл может быть повреждён.",
        { originalError: errorMessage, filename },
      );
    }
  }

  /**
   * Validates file format is supported
   *
   * Requirements: 1.5
   */
  private validateFormat(filename?: string): void {
    if (!filename) {
      return; // Allow files without names
    }

    const ext = filename.toLowerCase().split(".").pop();
    const supportedFormats = ["pdf", "docx", "doc"];

    if (!ext || !supportedFormats.includes(ext)) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.UNSUPPORTED_FORMAT,
        `Неподдерживаемый формат файла: ${ext}. Поддерживаются: ${supportedFormats.join(", ")}`,
        { filename, supportedFormats },
      );
    }
  }

  /**
   * Handles error responses from Docling service
   *
   * Requirements: 1.5
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const errorText = await response.text().catch(() => "");

    // Check for specific error patterns
    if (response.status === 400) {
      if (errorText.includes("password") || errorText.includes("encrypted")) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.PASSWORD_PROTECTED,
          "Документ защищён паролем. Пожалуйста, предоставьте незащищённую версию.",
        );
      }

      if (errorText.includes("corrupted") || errorText.includes("invalid")) {
        throw new DocumentProcessingError(
          DocumentProcessingErrorCode.CORRUPTED_FILE,
          "Документ повреждён или имеет неверный формат.",
        );
      }
    }

    if (response.status === 429) {
      throw new DocumentProcessingError(
        DocumentProcessingErrorCode.RATE_LIMITED,
        "Превышен лимит запросов к сервису обработки документов. Попробуйте позже.",
      );
    }

    // Generic error
    throw new DocumentProcessingError(
      DocumentProcessingErrorCode.CORRUPTED_FILE,
      `Ошибка обработки документа: ${response.status} ${response.statusText}`,
      { status: response.status, errorText },
    );
  }

  /**
   * Converts Docling service response to DoclingResult
   */
  private convertResponse(data: DoclingServiceResponse): DoclingResult {
    const elements: DocumentElement[] = [];

    if (data.elements) {
      for (const el of data.elements) {
        const element: DocumentElement = {
          type: this.normalizeElementType(el.type),
          content: el.content,
        };

        if (el.level !== undefined) {
          element.level = el.level;
        }

        if (el.rows) {
          element.rows = el.rows;
        }

        elements.push(element);
      }
    }

    return {
      text: data.text,
      metadata: {
        pageCount: data.metadata?.page_count,
        title: data.metadata?.title,
        author: data.metadata?.author,
        createdAt: data.metadata?.created_at
          ? new Date(data.metadata.created_at)
          : undefined,
      },
      elements,
    };
  }

  /**
   * Normalizes element type from Docling response
   */
  private normalizeElementType(type: string): DocumentElement["type"] {
    const normalized = type.toLowerCase();

    if (normalized.includes("heading") || normalized.includes("title")) {
      return "heading";
    }
    if (normalized.includes("list")) {
      return "list";
    }
    if (normalized.includes("table")) {
      return "table";
    }
    if (normalized.includes("image") || normalized.includes("figure")) {
      return "image";
    }

    return "paragraph";
  }

  /**
   * Determines MIME type from filename
   */
  private getMimeType(filename?: string): string {
    if (!filename) return "application/octet-stream";

    const ext = filename.toLowerCase().split(".").pop();

    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      doc: "application/msword",
    };

    return mimeTypes[ext || ""] || "application/octet-stream";
  }
}
