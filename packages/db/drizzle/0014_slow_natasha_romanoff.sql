CREATE TABLE "buffered_temp_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"temp_conversation_id" varchar(100) NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"sender" "temp_message_sender" NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"content" text NOT NULL,
	"external_message_id" varchar(100),
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "buffered_temp_message_conversation_idx" ON "buffered_temp_messages" USING btree ("temp_conversation_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_chat_idx" ON "buffered_temp_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_id_idx" ON "buffered_temp_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_timestamp_idx" ON "buffered_temp_messages" USING btree ("timestamp");