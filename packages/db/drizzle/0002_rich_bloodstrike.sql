CREATE TYPE "public"."outgoing_message_status" AS ENUM('PENDING_SEND', 'SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "outgoing_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"gig_response_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_telegram_username" varchar(100) NOT NULL,
	"recipient_chat_id" varchar(100),
	"message" text NOT NULL,
	"status" "outgoing_message_status" DEFAULT 'PENDING_SEND' NOT NULL,
	"sent_at" timestamp with time zone,
	"failure_reason" text,
	"external_message_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "dismissed_getting_started" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "company_settings" ADD COLUMN "dismissed_getting_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "outgoing_messages" ADD CONSTRAINT "outgoing_messages_gig_response_id_gig_responses_id_fk" FOREIGN KEY ("gig_response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outgoing_messages" ADD CONSTRAINT "outgoing_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outgoing_message_gig_response_idx" ON "outgoing_messages" USING btree ("gig_response_id");--> statement-breakpoint
CREATE INDEX "outgoing_message_status_idx" ON "outgoing_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outgoing_message_sender_idx" ON "outgoing_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "outgoing_message_recipient_idx" ON "outgoing_messages" USING btree ("recipient_telegram_username");--> statement-breakpoint
CREATE INDEX "outgoing_message_status_created_idx" ON "outgoing_messages" USING btree ("status","created_at");