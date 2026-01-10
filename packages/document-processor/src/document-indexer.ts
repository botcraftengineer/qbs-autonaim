import { EmbeddingService } from "./embeddings/embedding-service";
import { DoclingProcessor } from "./parsers/docling-processor";
import { UnstructuredParser } from "./parsers/unstructured-parser";
import type {
  EmbeddingProvider,
  FormatParser,
  IndexerConfig,
  SearchOptions,
  SearchResult,
  VectorStore,
} from "./types";
import { PgVectorStore } from "./vector-store/pgvector-store";

/**
 * Main API class for document indexing
 * Orchestrates: parsing → embedding → storage
 *
 * Requirements: 5.2, 5.3
 */
export class DocumentIndexer {
  private readonly parser: FormatParser;
  private readonly fallbackParser?: FormatParser;
  private readonly embeddingService: EmbeddingProvider;
  private readonly vectorStore: VectorStore;

  constructor(config: IndexerConfig) {
    // Initialize parser based on feature flag
    if (config.useDocling) {
      this.parser = new DoclingProcessor({
        timeout: 30000,
        enableOcr: true,
      });

      // Setup fallback if enabled
      if (config.fallbackToUnstructured) {
        const unstructuredUrl =
          process.env.UNSTRUCTURED_API_URL || "http://localhost:8000";
        this.fallbackParser = new UnstructuredParser({
          apiUrl: unstructuredUrl,
          timeout: 30000,
        });
      }
    } else {
      // Use Unstructured as primary parser
      const unstructuredUrl =
        process.env.UNSTRUCTURED_API_URL || "http://localhost:8000";
      this.parser = new UnstructuredParser({
        apiUrl: unstructuredUrl,
        timeout: 30000,
      });
    }

    // Initialize embedding service
    this.embeddingService = new EmbeddingService({
      ...config.embedding,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize vector store
    this.vectorStore = new PgVectorStore();
  }

  /**
   * Indexes a document: parses, generates embeddings, and stores them
   *
   * @param content - Document content as Buffer
   * @param documentId - Unique document identifier
   * @param metadata - Additional metadata to store with embeddings
   * @throws DocumentProcessingError if any step fails
   *
   * Requirements: 5.2
   */
  async index(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Step 1: Parse document
    const text = await this.parseDocument(content);

    // Step 2: Generate embeddings
    const embeddingResult = await this.embeddingService.embed(text, documentId);

    // Step 3: Store embeddings
    await this.vectorStore.store(embeddingResult, metadata);
  }

  /**
   * Reindexes a document: removes old embeddings and creates new ones
   * Ensures atomic replacement of embeddings
   *
   * @param content - Document content as Buffer
   * @param documentId - Unique document identifier
   * @param metadata - Additional metadata to store with embeddings
   * @throws DocumentProcessingError if any step fails
   *
   * Requirements: 5.2, 3.4
   */
  async reindex(
    content: Buffer,
    documentId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    // Step 1: Parse document
    const text = await this.parseDocument(content);

    // Step 2: Generate embeddings
    const embeddingResult = await this.embeddingService.embed(text, documentId);

    // Step 3: Delete old embeddings
    await this.vectorStore.deleteByDocument(documentId);

    // Step 4: Store new embeddings
    await this.vectorStore.store(embeddingResult, metadata);
  }

  /**
   * Removes a document from the index
   *
   * @param documentId - Unique document identifier
   * @throws Error if deletion fails
   *
   * Requirements: 5.3
   */
  async remove(documentId: string): Promise<void> {
    await this.vectorStore.deleteByDocument(documentId);
  }

  /**
   * Performs semantic search across indexed documents
   *
   * @param query - Search query text
   * @param options - Search options (topK, threshold, filters)
   * @returns Array of search results ordered by similarity
   * @throws DocumentProcessingError if embedding generation fails
   *
   * Requirements: 5.3
   */
  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    // Generate embedding for query
    const queryEmbedding = await this.embeddingService.embedQuery(query);

    // Search in vector store
    return await this.vectorStore.search(queryEmbedding, options);
  }

  /**
   * Parses document with fallback support
   * Tries primary parser first, falls back to secondary if enabled
   *
   * @param content - Document content as Buffer
   * @param filename - Optional filename for format detection
   * @returns Extracted text
   * @throws DocumentProcessingError if all parsers fail
   *
   * Requirements: 6.3, 6.4
   */
  private async parseDocument(
    content: Buffer,
    filename?: string,
  ): Promise<string> {
    try {
      return await this.parser.extractText(content, filename);
    } catch (error) {
      // If fallback is enabled and primary parser failed, try fallback
      if (this.fallbackParser) {
        console.warn(
          "Primary parser failed, attempting fallback parser:",
          error instanceof Error ? error.message : String(error),
        );

        try {
          return await this.fallbackParser.extractText(content, filename);
        } catch (fallbackError) {
          console.error(
            "Fallback parser also failed:",
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
          );
          // Throw original error since fallback also failed
          throw error;
        }
      }

      // No fallback available, throw original error
      throw error;
    }
  }
}
