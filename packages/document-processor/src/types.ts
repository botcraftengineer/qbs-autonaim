/**
 * Core types and interfaces for the document processor package
 */

// ============================================================================
// Parser Interfaces
// ============================================================================

/**
 * Configuration for Docling processor
 */
export interface DoclingConfig {
  /** Таймаут обработки в миллисекундах */
  timeout?: number;
  /** Включить OCR для сканированных документов */
  enableOcr?: boolean;
  /** Язык OCR (по умолчанию: auto) */
  ocrLanguage?: string;
}

/**
 * Structured element extracted from a document
 */
export interface DocumentElement {
  type: "paragraph" | "heading" | "list" | "table" | "image";
  content: string;
  level?: number; // для заголовков
  rows?: string[][]; // для таблиц
}

/**
 * Result of document parsing with structure
 */
export interface DoclingResult {
  /** Извлечённый текст */
  text: string;
  /** Метаданные документа */
  metadata: {
    pageCount?: number;
    title?: string;
    author?: string;
    createdAt?: Date;
  };
  /** Структурированные элементы (таблицы, списки) */
  elements: DocumentElement[];
}

/**
 * Interface for document format parsers
 * Provides a common interface for different parsing implementations
 */
export interface FormatParser {
  /**
   * Извлекает текст из документа
   * @param content - Содержимое файла в виде Buffer
   * @param filename - Имя файла (опционально, для определения типа)
   * @returns Извлечённый текст
   */
  extractText(content: Buffer, filename?: string): Promise<string>;
}

// ============================================================================
// Embedding Interfaces
// ============================================================================

/**
 * Configuration for embedding service
 */
export interface EmbeddingConfig {
  /** Провайдер эмбеддингов */
  provider: "openai" | "anthropic" | "local";
  /** Модель для эмбеддингов */
  model: string;
  /** Размер чанка текста */
  chunkSize: number;
  /** Перекрытие между чанками */
  chunkOverlap: number;
  /** Размерность вектора */
  dimensions: number;
}

/**
 * Text chunk with position information
 */
export interface TextChunk {
  /** Текст чанка */
  text: string;
  /** Индекс чанка в документе */
  index: number;
  /** Начальная позиция в исходном тексте */
  startOffset: number;
  /** Конечная позиция в исходном тексте */
  endOffset: number;
}

/**
 * Result of embedding generation
 */
export interface EmbeddingResult {
  /** ID исходного документа */
  documentId: string;
  /** Чанки с эмбеддингами */
  chunks: Array<{
    chunk: TextChunk;
    embedding: number[];
  }>;
}

/**
 * Interface for embedding providers
 */
export interface EmbeddingProvider {
  /**
   * Генерирует эмбеддинги для текста
   * @param text - Текст для генерации эмбеддингов
   * @param documentId - ID документа
   * @returns Результат с чанками и эмбеддингами
   */
  embed(text: string, documentId: string): Promise<EmbeddingResult>;

  /**
   * Генерирует эмбеддинг для поискового запроса
   * @param query - Поисковый запрос
   * @returns Вектор эмбеддинга
   */
  embedQuery(query: string): Promise<number[]>;
}

// ============================================================================
// Vector Store Interfaces
// ============================================================================

/**
 * Configuration for vector store
 */
export interface VectorStoreConfig {
  /** URL Qdrant сервера */
  url: string;
  /** API ключ (опционально) */
  apiKey?: string;
  /** Имя коллекции */
  collectionName: string;
  /** Размерность векторов */
  dimensions: number;
}

/**
 * Stored embedding with metadata
 */
export interface StoredEmbedding {
  id: string;
  documentId: string;
  chunkIndex: number;
  chunkText: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Search result from vector store
 */
export interface SearchResult {
  documentId: string;
  chunkText: string;
  chunkIndex: number;
  similarity: number;
  metadata: Record<string, unknown>;
}

/**
 * Options for vector search
 */
export interface SearchOptions {
  /** Количество результатов */
  topK: number;
  /** Минимальный порог схожести (0-1) */
  threshold?: number;
  /** Фильтр по метаданным */
  filter?: {
    documentIds?: string[];
    candidateId?: string;
    dateFrom?: Date;
    dateTo?: Date;
  };
}

/**
 * Interface for vector storage implementations
 */
export interface VectorStore {
  /**
   * Инициализирует таблицу и индексы
   */
  initialize(): Promise<void>;

  /**
   * Сохраняет эмбеддинги
   * @param result - Результат генерации эмбеддингов
   * @param metadata - Дополнительные метаданные
   */
  store(
    result: EmbeddingResult,
    metadata?: Record<string, unknown>,
  ): Promise<void>;

  /**
   * Удаляет эмбеддинги документа
   * @param documentId - ID документа
   */
  deleteByDocument(documentId: string): Promise<void>;

  /**
   * Семантический поиск
   * @param queryEmbedding - Вектор запроса
   * @param options - Опции поиска
   * @returns Результаты поиска
   */
  search(
    queryEmbedding: number[],
    options: SearchOptions,
  ): Promise<SearchResult[]>;
}

// ============================================================================
// Document Indexer Configuration
// ============================================================================

/**
 * Configuration for document indexer
 */
export interface IndexerConfig {
  /** Конфигурация эмбеддингов */
  embedding: EmbeddingConfig;
  /** Конфигурация vector store */
  vectorStore: VectorStoreConfig;
  /** Feature flag для использования нового процессора */
  useDocling: boolean;
  /** Fallback на Unstructured при ошибках */
  fallbackToUnstructured: boolean;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Error codes for document processing
 */
export enum DocumentProcessingErrorCode {
  CORRUPTED_FILE = "CORRUPTED_FILE",
  PASSWORD_PROTECTED = "PASSWORD_PROTECTED",
  UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT",
  EMPTY_CONTENT = "EMPTY_CONTENT",
  PARSE_TIMEOUT = "PARSE_TIMEOUT",
  PROVIDER_UNAVAILABLE = "PROVIDER_UNAVAILABLE",
  RATE_LIMITED = "RATE_LIMITED",
  INVALID_INPUT = "INVALID_INPUT",
}

/**
 * Custom error for document processing
 */
export class DocumentProcessingError extends Error {
  constructor(
    public code: DocumentProcessingErrorCode,
    message: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DocumentProcessingError";
  }
}
