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

/**
 * Таблица для хранения векторных эмбеддингов документов
 * Используется для семантического поиска по содержимому резюме
 */
export const documentEmbedding = pgTable(
  "document_embeddings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: varchar("document_id", { length: 255 }).notNull(),
    chunkIndex: integer("chunk_index").notNull(),
    chunkText: text("chunk_text").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    documentIdIdx: index("idx_embeddings_document_id").on(table.documentId),
    uniqueChunk: unique("unique_document_chunk").on(
      table.documentId,
      table.chunkIndex,
    ),
  }),
);

export type DocumentEmbedding = typeof documentEmbedding.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbedding.$inferInsert;
