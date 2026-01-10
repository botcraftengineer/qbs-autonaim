# @qbs-autonaim/document-processor

Document processing package with support for parsing, embedding generation, and semantic search.

## Features

- **Document Parsing**: Support for PDF, DOCX via Docling
- **Embedding Generation**: Integration with LlamaIndex for vector embeddings
- **Vector Storage**: Qdrant for efficient similarity search
- **Semantic Search**: Find relevant document chunks based on meaning

## Installation

This package is part of the monorepo and uses workspace dependencies:

```bash
bun install
```

## Usage

### Basic Document Indexing

```typescript
import { DocumentIndexer } from "@qbs-autonaim/document-processor";

const indexer = new DocumentIndexer({
  embedding: {
    provider: "openai",
    model: "text-embedding-ada-002",
    chunkSize: 512,
    chunkOverlap: 50,
    dimensions: 1536,
  },
  vectorStore: {
    url: process.env.QDRANT_URL,
    collectionName: "document_embeddings",
    dimensions: 1536,
  },
});

// Index a document
const documentBuffer = await fs.readFile("resume.pdf");
await indexer.index(documentBuffer, "doc-123", {
  candidateId: "candidate-456",
  uploadedAt: new Date(),
});

// Search for similar content
const results = await indexer.search("Python developer with 5 years experience", {
  topK: 5,
  threshold: 0.7,
});
```

### Using Individual Components

```typescript
import {
  DoclingProcessor,
  EmbeddingService,
  QdrantVectorStore,
} from "@qbs-autonaim/document-processor";

// Parse a document
const parser = new DoclingProcessor({ enableOcr: true });
const text = await parser.extractText(documentBuffer);

// Generate embeddings
const embeddingService = new EmbeddingService({
  provider: "openai",
  model: "text-embedding-ada-002",
  chunkSize: 512,
  chunkOverlap: 50,
  dimensions: 1536,
});
const embeddings = await embeddingService.embed(text, "doc-123");

// Store in vector database
const vectorStore = new QdrantVectorStore({
  url: process.env.QDRANT_URL,
  collectionName: "document_embeddings",
  dimensions: 1536,
});
await vectorStore.initialize();
await vectorStore.store(embeddings);
```

## Architecture

```
packages/document-processor/
├── src/
│   ├── parsers/
│   │   ├── docling-processor.ts      # Docling-based parser
│   │   └── index.ts
│   ├── embeddings/
│   │   ├── embedding-service.ts      # LlamaIndex integration
│   │   ├── text-chunker.ts           # Text chunking logic
│   │   └── index.ts
│   ├── vector-store/
│   │   ├── qdrant-store.ts           # Qdrant implementation
│   │   └── index.ts
│   ├── document-indexer.ts           # Main orchestrator
│   ├── types.ts                      # TypeScript interfaces
│   └── index.ts                      # Public exports
└── tests/                            # Test files
```

## Configuration

### Environment Variables

```env
# Qdrant connection
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=  # Optional, for production
QDRANT_COLLECTION_NAME=document_embeddings

# OpenAI API (if using OpenAI embeddings)
OPENAI_API_KEY=sk-...
```

### Embedding Providers

Supported providers:
- `openai`: OpenAI embeddings (text-embedding-ada-002, text-embedding-3-small, etc.)
- `anthropic`: Anthropic embeddings
- `local`: Local embedding models

## Qdrant Setup

The package uses Qdrant for vector storage. Run Qdrant locally with Docker:

```bash
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant
```

Or use docker-compose (already configured in the project).

The collection is created automatically on first use.

## Development

```bash
# Type checking
bun run typecheck

# Run tests
bun run test

# Build
bun run build
```

## Testing

The package includes both unit tests and property-based tests:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch
```

## License

MIT
