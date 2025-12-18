CREATE TYPE "public"."response_event_type" AS ENUM('STATUS_CHANGED', 'HR_STATUS_CHANGED', 'TELEGRAM_USERNAME_ADDED', 'CHAT_ID_ADDED', 'PHONE_ADDED', 'RESUME_UPDATED', 'PHOTO_ADDED', 'WELCOME_SENT', 'COMMENT_ADDED', 'SALARY_UPDATED', 'CONTACT_INFO_UPDATED', 'CREATED');--> statement-breakpoint
CREATE TABLE "vacancy_response_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"event_type" "response_event_type" NOT NULL,
	"user_id" text,
	"old_value" jsonb,
	"new_value" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;