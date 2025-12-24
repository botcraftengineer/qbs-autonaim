CREATE TYPE "public"."conversation_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('TELEGRAM', 'HH');--> statement-breakpoint
CREATE TYPE "public"."message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('CANDIDATE', 'BOT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."file_provider" AS ENUM('S3');--> statement-breakpoint
CREATE TYPE "public"."temp_message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."temp_message_sender" AS ENUM('CANDIDATE', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'OFFER', 'SECURITY_PASSED', 'CONTRACT_SENT', 'ONBOARDING');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."response_event_type" AS ENUM('STATUS_CHANGED', 'HR_STATUS_CHANGED', 'TELEGRAM_USERNAME_ADDED', 'CHAT_ID_ADDED', 'PHONE_ADDED', 'RESUME_UPDATED', 'PHOTO_ADDED', 'WELCOME_SENT', 'OFFER_SENT', 'COMMENT_ADDED', 'SALARY_UPDATED', 'CONTACT_INFO_UPDATED', 'CREATED');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text,
	"bio" text,
	"role" text DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_settings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"description" text,
	"bot_name" text DEFAULT 'Дмитрий',
	"bot_role" text DEFAULT 'рекрутер',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "company_settings_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
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
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"candidate_name" varchar(500),
	"username" varchar(100),
	"status" "conversation_status" DEFAULT 'ACTIVE' NOT NULL,
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_response_id_unique" UNIQUE("response_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender" "message_sender" NOT NULL,
	"content_type" "message_content_type" DEFAULT 'TEXT' NOT NULL,
	"channel" "message_channel" DEFAULT 'TELEGRAM' NOT NULL,
	"content" text NOT NULL,
	"file_id" uuid,
	"voice_duration" varchar(20),
	"voice_transcription" text,
	"external_message_id" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"provider" "file_provider" DEFAULT 'S3' NOT NULL,
	"key" text NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" varchar(50),
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"cookies" jsonb,
	"metadata" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integrations_workspace_id_type_unique" UNIQUE("workspace_id","type")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT organization_id_generate() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "organization_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"organization_id" text NOT NULL,
	"token" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_email" text,
	"invited_user_id" text,
	"created_by" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
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
CREATE TABLE "telegram_interview_scorings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"response_id" uuid,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"analysis" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_interview_scorings_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"api_id" text NOT NULL,
	"api_hash" text NOT NULL,
	"phone" text NOT NULL,
	"session_data" jsonb NOT NULL,
	"user_info" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"auth_error" text,
	"auth_error_at" timestamp,
	"auth_error_notified_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "telegram_sessions_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "vacancy_responses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" varchar(50) NOT NULL,
	"resume_id" varchar(100) NOT NULL,
	"resume_url" text NOT NULL,
	"candidate_name" varchar(500),
	"telegram_username" varchar(100),
	"chat_id" varchar(100),
	"cover_letter" text,
	"status" "response_status" DEFAULT 'NEW' NOT NULL,
	"hr_selection_status" "hr_selection_status",
	"experience" text,
	"contacts" jsonb,
	"phone" varchar(50),
	"resume_language" varchar(10) DEFAULT 'ru',
	"telegram_pin_code" varchar(4),
	"resume_pdf_file_id" uuid,
	"photo_file_id" uuid,
	"salary_expectations" varchar(200),
	"responded_at" timestamp with time zone,
	"welcome_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "vacancy_responses_vacancy_id_resume_id_unique" UNIQUE("vacancy_id","resume_id")
);
--> statement-breakpoint
CREATE TABLE "vacancy_response_comments" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"is_private" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "response_screenings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "score_check" CHECK ("response_screenings"."score" BETWEEN 0 AND 5),
	CONSTRAINT "detailed_score_check" CHECK ("response_screenings"."detailed_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"workspace_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" text,
	"views" integer DEFAULT 0,
	"responses" integer DEFAULT 0,
	"new_responses" integer DEFAULT 0,
	"resumes_in_progress" integer DEFAULT 0,
	"suitable_resumes" integer DEFAULT 0,
	"region" varchar(200),
	"description" text,
	"requirements" jsonb,
	"source" text DEFAULT 'hh' NOT NULL,
	"external_id" varchar(100),
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY DEFAULT workspace_id_generate() NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
CREATE TABLE "workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"token" text NOT NULL,
	"invited_user_id" text,
	"invited_email" text,
	"role" text DEFAULT 'member' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buffered_messages" ADD CONSTRAINT "buffered_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_interview_scorings" ADD CONSTRAINT "telegram_interview_scorings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_interview_scorings" ADD CONSTRAINT "telegram_interview_scorings_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_resume_pdf_file_id_files_id_fk" FOREIGN KEY ("resume_pdf_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_comments" ADD CONSTRAINT "vacancy_response_comments_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_comments" ADD CONSTRAINT "vacancy_response_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screenings_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_conversation_step_idx" ON "buffered_messages" USING btree ("conversation_id","interview_step");--> statement-breakpoint
CREATE INDEX "buffered_message_user_idx" ON "buffered_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_id_idx" ON "buffered_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_message_timestamp_idx" ON "buffered_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_conversation_idx" ON "buffered_temp_messages" USING btree ("temp_conversation_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_chat_idx" ON "buffered_temp_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_id_idx" ON "buffered_temp_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_timestamp_idx" ON "buffered_temp_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "screening_response_idx" ON "response_screenings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "vacancy_workspace_idx" ON "vacancies" USING btree ("workspace_id");