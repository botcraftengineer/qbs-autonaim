CREATE TYPE "public"."temp_message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."temp_message_sender" AS ENUM('CANDIDATE', 'BOT');--> statement-breakpoint
CREATE TABLE "temp_conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"temp_conversation_id" varchar(100) NOT NULL,
	"chat_id" varchar(100) NOT NULL,
	"sender" "temp_message_sender" NOT NULL,
	"content_type" "temp_message_content_type" DEFAULT 'TEXT' NOT NULL,
	"content" text NOT NULL,
	"external_message_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
