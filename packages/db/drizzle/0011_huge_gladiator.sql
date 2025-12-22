CREATE TABLE "buffered_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"conversation_id" uuid NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"interview_step" integer NOT NULL,
	"content" varchar(10000) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"question_context" varchar(1000),
	"timestamp" bigint NOT NULL,
	"flush_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "message_buffers" CASCADE;--> statement-breakpoint
ALTER TABLE "buffered_messages" ADD CONSTRAINT "buffered_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "buffered_message_conversation_step_idx" ON "buffered_messages" USING btree ("conversation_id","interview_step");--> statement-breakpoint
CREATE INDEX "buffered_message_user_idx" ON "buffered_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_id_idx" ON "buffered_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_message_timestamp_idx" ON "buffered_messages" USING btree ("timestamp");