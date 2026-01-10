/**
 * Resume Parser Service Types
 *
 * Типы для сервиса парсинга резюме из различных форматов (PDF, DOCX).
 * Основные типы данных (ParsedResume, StructuredResume и т.д.) реэкспортируются
 * из схемы БД для обеспечения консистентности.
 */

// Re-export core types from DB schema for consistency
export type {
  Education,
  Language,
  ParsedResume,
  ParsedResumePersonalInfo,
  StructuredResume,
  WorkExperience,
} from "@qbs-autonaim/db";

/**
 * Поддерживаемые форматы файлов резюме
 */
export type ResumeFileType = "pdf" | "docx" | "doc" | "txt" | "rtf" | "odt";

/**
 * Входные данные для парсера резюме
 */
export interface ResumeInput {
  /** Тип файла */
  type: ResumeFileType;
  /** Содержимое файла в виде Buffer */
  content: Buffer;
  /** Оригинальное имя файла (опционально, для логирования) */
  filename?: string;
}

/**
 * Результат валидации формата файла
 */
export type FormatValidationResult =
  | {
      /** Валиден ли формат */
      isValid: true;
      /** Определённый тип файла */
      fileType: ResumeFileType;
      /** Сообщение об ошибке отсутствует */
      error?: never;
      /** Список поддерживаемых форматов */
      supportedFormats: ResumeFileType[];
    }
  | {
      /** Валиден ли формат */
      isValid: false;
      /** Тип файла не определён */
      fileType?: never;
      /** Сообщение об ошибке */
      error: string;
      /** Список поддерживаемых форматов */
      supportedFormats: ResumeFileType[];
    };

/**
 * Коды ошибок парсера резюме
 */
export type ResumeParserErrorCode =
  | "UNSUPPORTED_FORMAT"
  | "FILE_TOO_LARGE"
  | "CORRUPTED_FILE"
  | "PARSE_FAILED"
  | "AI_STRUCTURING_FAILED"
  | "EMPTY_CONTENT"
  | "INDEXING_DISABLED"
  | "INDEXING_FAILED"
  | "SEARCH_FAILED";

/**
 * Ошибка парсера резюме
 */
export class ResumeParserError extends Error {
  readonly code: ResumeParserErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: ResumeParserErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "ResumeParserError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Конфигурация парсера резюме
 */
export interface ResumeParserConfig {
  /** Максимальный размер файла в байтах (по умолчанию 10MB) */
  maxFileSizeBytes: number;
  /** Минимальная длина извлечённого текста для валидного резюме */
  minTextLength: number;
  /** Таймаут для AI структурирования в миллисекундах */
  aiTimeoutMs: number;
}

/**
 * Конфигурация по умолчанию
 */
export const DEFAULT_PARSER_CONFIG: ResumeParserConfig = {
  maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
  minTextLength: 50,
  aiTimeoutMs: 30000, // 30 секунд
};

/**
 * Интерфейс для отдельного парсера формата (PDF, DOCX)
 */
export interface FormatParser {
  /** Извлекает текст из файла */
  extractText(content: Buffer, filename?: string): Promise<string>;
}

/**
 * Интерфейс для AI-структуризатора резюме
 */
export interface ResumeStructurer {
  /** Структурирует сырой текст резюме с помощью AI */
  structure(
    rawText: string,
  ): Promise<import("@qbs-autonaim/db").StructuredResume>;
}
