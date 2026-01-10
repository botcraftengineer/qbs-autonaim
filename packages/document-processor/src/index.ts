/**
 * @qbs-autonaim/document-processor
 *
 * Document processing package for parsing, embedding, and indexing documents
 * Supports PDF, DOCX formats with semantic search capabilities
 */

// ============================================================================
// Main API
// ============================================================================

export { DocumentIndexer } from "./document-indexer";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type {
  DoclingConfig,
  DoclingResult,
  DocumentElement,
  // Embedding types
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingResult,
  // Parser types
  FormatParser,
  // Indexer types
  IndexerConfig,
  SearchOptions,
  SearchResult,
  StoredEmbedding,
  TextChunk,
  // Vector store types
  VectorStore,
  VectorStoreConfig,
} from "./types";

export {
  DocumentProcessingError,
  DocumentProcessingErrorCode,
} from "./types";

// ============================================================================
// Individual Components (for customization)
// ============================================================================

export type { EmbeddingServiceConfig } from "./embeddings/embedding-service";
// Embeddings
export { EmbeddingService } from "./embeddings/embedding-service";
export type { RetryConfig } from "./embeddings/retry";
// Retry utilities
export { DEFAULT_RETRY_CONFIG, withRetry } from "./embeddings/retry";
export type { ChunkingConfig } from "./embeddings/text-chunker";
export { TextChunker } from "./embeddings/text-chunker";
// Parsers
export { DoclingProcessor } from "./parsers/docling-processor";
export { UnstructuredParser } from "./parsers/unstructured-parser";
// Vector Store
export { PgVectorStore } from "./vector-store/pgvector-store";
