import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  vector,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Table for storing document embeddings with pgvector support
 * Used for semantic search across document content
 */
export const documentEmbedding = pgTable(
  "document_embeddings",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    documentId: varchar("document_id", { length: 255 }).notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    chunkText: text("chunk_text").notNull(),
    // Vector dimension should match the embedding model (e.g., 1536 for OpenAI text-embedding-ada-002)
    embedding: vector("embedding", { dimensions: 1536 }),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Index for fast lookup by document ID
    documentIdIdx: index("idx_embeddings_document_id").on(table.documentId),
    // Unique constraint to prevent duplicate chunks
    uniqueChunk: unique("unique_document_chunk").on(
      table.documentId,
      table.chunkIndex,
    ),
    // IVFFlat index for vector similarity search (cosine distance)
    // Note: This index should be created manually after table creation with sufficient data
    // CREATE INDEX idx_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
  }),
);

export const CreateDocumentEmbeddingSchema = createInsertSchema(
  documentEmbedding,
  {
    documentId: z.string().max(255),
    chunkIndex: z.number().int().nonnegative(),
    chunkText: z.string(),
    embedding: z.array(z.number()).length(1536),
    metadata: z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type DocumentEmbedding = typeof documentEmbedding.$inferSelect;
export type NewDocumentEmbedding = z.infer<
  typeof CreateDocumentEmbeddingSchema
>;
