CREATE TYPE "public"."message_channel" AS ENUM('TELEGRAM', 'HH');--> statement-breakpoint
ALTER TABLE "conversation_messages" RENAME COLUMN "telegram_message_id" TO "external_message_id";--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD COLUMN "channel" "message_channel" DEFAULT 'TELEGRAM' NOT NULL;