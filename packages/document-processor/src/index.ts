/**
 * @qbs-autonaim/document-processor
 *
 * Document processing package with support for:
 * - Document parsing (Docling, Unstructured)
 * - Embedding generation (LlamaIndex)
 * - Vector storage (pgvector)
 * - Semantic search
 */

// Main API
export { DocumentIndexer } from "./document-indexer";
export { EmbeddingService } from "./embeddings/embedding-service";
export { TextChunker } from "./embeddings/text-chunker";

// Individual components for customization
export { DoclingProcessor } from "./parsers/docling-processor";
export { UnstructuredParser } from "./parsers/unstructured-parser";
// Types and interfaces
export type {
  DoclingConfig,
  DoclingResult,
  DocumentElement,
  EmbeddingConfig,
  EmbeddingProvider,
  EmbeddingResult,
  FormatParser,
  IndexerConfig,
  SearchOptions,
  SearchResult,
  StoredEmbedding,
  TextChunk,
  VectorStore,
  VectorStoreConfig,
} from "./types";
export { DocumentProcessingError, DocumentProcessingErrorCode } from "./types";
export { PgVectorStore } from "./vector-store/pgvector-store";
