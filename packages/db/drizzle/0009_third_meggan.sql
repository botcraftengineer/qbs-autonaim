CREATE TABLE "message_buffers" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"interview_step" integer NOT NULL,
	"messages" jsonb NOT NULL,
	"flush_id" varchar(100),
	"created_at" bigint NOT NULL,
	"last_updated_at" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "message_buffers" ADD CONSTRAINT "message_buffers_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "message_buffer_conversation_step_idx" ON "message_buffers" USING btree ("conversation_id","interview_step");--> statement-breakpoint
CREATE INDEX "message_buffer_user_idx" ON "message_buffers" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "message_buffer_unique_idx" ON "message_buffers" USING btree ("conversation_id","interview_step");