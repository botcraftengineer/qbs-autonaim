CREATE TABLE "document_embeddings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" varchar(255) NOT NULL,
	"chunk_index" integer NOT NULL,
	"chunk_text" text NOT NULL,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unique_document_chunk" UNIQUE("document_id","chunk_index")
);
--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "interview_media_file_ids" jsonb;--> statement-breakpoint
CREATE INDEX "idx_embeddings_document_id" ON "document_embeddings" USING btree ("document_id");