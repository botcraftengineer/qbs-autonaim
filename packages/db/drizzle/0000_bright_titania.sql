CREATE TYPE "public"."audit_action" AS ENUM('VIEW', 'EXPORT', 'UPDATE', 'DELETE', 'ACCESS', 'CREATE', 'EVALUATE', 'SUBMIT');--> statement-breakpoint
CREATE TYPE "public"."audit_resource_type" AS ENUM('VACANCY_RESPONSE', 'CONVERSATION', 'RESUME', 'CONTACT_INFO', 'VACANCY', 'PREQUALIFICATION_SESSION', 'WIDGET_CONFIG', 'CUSTOM_DOMAIN', 'RULE');--> statement-breakpoint
CREATE TYPE "public"."conversation_source" AS ENUM('TELEGRAM', 'WEB');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."message_channel" AS ENUM('TELEGRAM', 'HH', 'WEB');--> statement-breakpoint
CREATE TYPE "public"."message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."message_sender" AS ENUM('CANDIDATE', 'BOT', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."file_provider" AS ENUM('S3');--> statement-breakpoint
CREATE TYPE "public"."gig_type" AS ENUM('DEVELOPMENT', 'DESIGN', 'COPYWRITING', 'MARKETING', 'TRANSLATION', 'VIDEO', 'AUDIO', 'DATA_ENTRY', 'RESEARCH', 'CONSULTING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gig_hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'SELECTED', 'CONTRACT_SENT', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."gig_import_source" AS ENUM('MANUAL', 'KWORK', 'FL_RU', 'WEBLANCER', 'UPWORK', 'FREELANCE_RU', 'WEB_LINK');--> statement-breakpoint
CREATE TYPE "public"."gig_response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'NEGOTIATION', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_type" AS ENUM('widget_view', 'session_start', 'resume_upload', 'dialogue_message', 'dialogue_complete', 'evaluation_complete', 'application_submit');--> statement-breakpoint
CREATE TYPE "public"."ssl_status" AS ENUM('pending', 'active', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."fit_decision" AS ENUM('strong_fit', 'potential_fit', 'not_fit');--> statement-breakpoint
CREATE TYPE "public"."prequalification_source" AS ENUM('widget', 'direct');--> statement-breakpoint
CREATE TYPE "public"."prequalification_status" AS ENUM('consent_pending', 'resume_pending', 'dialogue_active', 'evaluating', 'completed', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."honesty_level" AS ENUM('direct', 'diplomatic', 'encouraging');--> statement-breakpoint
CREATE TYPE "public"."widget_tone" AS ENUM('formal', 'friendly');--> statement-breakpoint
CREATE TYPE "public"."agent_feedback_type" AS ENUM('accepted', 'rejected', 'modified', 'error_report');--> statement-breakpoint
CREATE TYPE "public"."outgoing_message_status" AS ENUM('PENDING_SEND', 'SENT', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."temp_message_content_type" AS ENUM('TEXT', 'VOICE');--> statement-breakpoint
CREATE TYPE "public"."temp_message_sender" AS ENUM('CANDIDATE', 'BOT');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('SINGLE', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'OFFER', 'SECURITY_PASSED', 'CONTRACT_SENT', 'ONBOARDING');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('HH_API', 'FREELANCE_MANUAL', 'FREELANCE_LINK');--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."response_event_type" AS ENUM('STATUS_CHANGED', 'HR_STATUS_CHANGED', 'TELEGRAM_USERNAME_ADDED', 'CHAT_ID_ADDED', 'PHONE_ADDED', 'RESUME_UPDATED', 'PHOTO_ADDED', 'WELCOME_SENT', 'OFFER_SENT', 'COMMENT_ADDED', 'SALARY_UPDATED', 'CONTACT_INFO_UPDATED', 'CREATED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"workspace_id" text,
	"action" "audit_action" NOT NULL,
	"resource_type" "audit_resource_type" NOT NULL,
	"resource_id" text NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"last_active_organization_id" text,
	"last_active_workspace_id" text,
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
	"onboarding_completed" boolean DEFAULT false,
	"onboarding_completed_at" timestamp with time zone,
	"dismissed_getting_started" boolean DEFAULT false,
	"dismissed_getting_started_at" timestamp with time zone,
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
	"response_id" uuid,
	"gig_response_id" uuid,
	"candidate_name" varchar(500),
	"username" varchar(100),
	"status" "conversation_status" DEFAULT 'ACTIVE' NOT NULL,
	"source" "conversation_source" DEFAULT 'TELEGRAM' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "conversations_response_id_unique" UNIQUE("response_id"),
	CONSTRAINT "conversations_gig_response_id_unique" UNIQUE("gig_response_id")
);
--> statement-breakpoint
CREATE TABLE "conversation_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender" "message_sender" NOT NULL,
	"content_type" "message_content_type" DEFAULT 'TEXT' NOT NULL,
	"channel" "message_channel" NOT NULL,
	"content" text NOT NULL,
	"file_id" uuid,
	"voice_duration" varchar(20),
	"voice_transcription" text,
	"external_message_id" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"provider" "file_provider" DEFAULT 'S3' NOT NULL,
	"key" text NOT NULL,
	"file_name" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" varchar(50),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gigs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"requirements" jsonb,
	"type" "gig_type" DEFAULT 'OTHER' NOT NULL,
	"budget_min" integer,
	"budget_max" integer,
	"budget_currency" varchar(3) DEFAULT 'RUB',
	"deadline" timestamp with time zone,
	"estimated_duration" varchar(100),
	"source" text DEFAULT 'manual' NOT NULL,
	"external_id" varchar(100),
	"url" text,
	"views" integer DEFAULT 0,
	"responses" integer DEFAULT 0,
	"new_responses" integer DEFAULT 0,
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_interview_media" (
	"gig_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gig_interview_media_gig_id_file_id_pk" PRIMARY KEY("gig_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "gig_interview_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"gig_id" uuid NOT NULL,
	"token" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "gig_interview_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "gig_invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"invitation_text" text NOT NULL,
	"interview_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_responses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"gig_id" uuid NOT NULL,
	"candidate_id" varchar(100) NOT NULL,
	"candidate_name" varchar(500),
	"profile_url" text,
	"telegram_username" varchar(100),
	"chat_id" varchar(100),
	"phone" varchar(50),
	"email" varchar(255),
	"contacts" jsonb,
	"resume_language" varchar(10) DEFAULT 'ru',
	"proposed_price" integer,
	"proposed_currency" varchar(3) DEFAULT 'RUB',
	"proposed_delivery_days" integer,
	"cover_letter" text,
	"portfolio_links" jsonb,
	"portfolio_file_id" uuid,
	"photo_file_id" uuid,
	"experience" text,
	"skills" jsonb,
	"rating" varchar(20),
	"status" "gig_response_status" DEFAULT 'NEW' NOT NULL,
	"hr_selection_status" "gig_hr_selection_status",
	"import_source" "gig_import_source" DEFAULT 'MANUAL',
	"telegram_pin_code" varchar(4),
	"responded_at" timestamp with time zone,
	"welcome_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gig_responses_gig_id_candidate_id_unique" UNIQUE("gig_id","candidate_id")
);
--> statement-breakpoint
CREATE TABLE "gig_response_screenings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"analysis" text,
	"price_analysis" text,
	"delivery_analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gig_score_check" CHECK ("gig_response_screenings"."score" BETWEEN 0 AND 5),
	CONSTRAINT "gig_detailed_score_check" CHECK ("gig_response_screenings"."detailed_score" BETWEEN 0 AND 100)
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
CREATE TABLE "interview_scorings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"response_id" uuid,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"analysis" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorings_conversation_id_unique" UNIQUE("conversation_id")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT organization_id_generate() NOT NULL,
	"external_id" varchar(100),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "organization_members" (
	"user_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_members_user_id_organization_id_pk" PRIMARY KEY("user_id","organization_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"vacancy_id" uuid,
	"session_id" uuid,
	"event_type" "analytics_event_type" NOT NULL,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_domains" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"domain" varchar(255) NOT NULL,
	"cname_target" varchar(255) NOT NULL,
	"verified" boolean DEFAULT false,
	"verified_at" timestamp with time zone,
	"last_verification_attempt" timestamp with time zone,
	"verification_error" text,
	"ssl_status" "ssl_status" DEFAULT 'pending',
	"ssl_certificate_id" varchar(255),
	"ssl_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "prequalification_sessions" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"response_id" uuid,
	"conversation_id" uuid,
	"status" "prequalification_status" DEFAULT 'consent_pending' NOT NULL,
	"source" "prequalification_source" DEFAULT 'widget' NOT NULL,
	"parsed_resume" jsonb,
	"fit_score" integer,
	"fit_decision" "fit_decision",
	"evaluation" jsonb,
	"candidate_feedback" text,
	"consent_given_at" timestamp with time zone,
	"user_agent" text,
	"ip_address" varchar(45),
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_configs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"logo" text,
	"primary_color" varchar(7) DEFAULT '#3B82F6',
	"secondary_color" varchar(7) DEFAULT '#1E40AF',
	"background_color" varchar(7) DEFAULT '#FFFFFF',
	"text_color" varchar(7) DEFAULT '#1F2937',
	"font_family" varchar(100) DEFAULT 'Inter',
	"assistant_name" varchar(100) DEFAULT 'ИИ Ассистент',
	"assistant_avatar" text,
	"welcome_message" text,
	"completion_message" text,
	"pass_threshold" integer DEFAULT 60,
	"mandatory_questions" jsonb DEFAULT '[]'::jsonb,
	"tone" "widget_tone" DEFAULT 'friendly',
	"honesty_level" "honesty_level" DEFAULT 'diplomatic',
	"max_dialogue_turns" integer DEFAULT 10,
	"session_timeout_minutes" integer DEFAULT 30,
	"consent_text" text,
	"disclaimer_text" text,
	"privacy_policy_url" text,
	"data_retention_days" integer DEFAULT 90,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "widget_configs_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "agent_feedback" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"user_id" text NOT NULL,
	"action_id" uuid,
	"recommendation_id" uuid,
	"feedback_type" "agent_feedback_type" NOT NULL,
	"original_recommendation" text,
	"user_action" text,
	"reason" text,
	"rating" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "freelance_import_history" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"imported_by" uuid NOT NULL,
	"import_mode" "import_mode" NOT NULL,
	"platform_source" varchar(50) NOT NULL,
	"raw_text" text,
	"parsed_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "freelance_invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"invitation_text" text NOT NULL,
	"interview_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"token" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "interview_links_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "platform_config" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"platform_code" varchar(50) NOT NULL,
	"platform_name" varchar(200) NOT NULL,
	"profile_url_pattern" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_config_platform_code_unique" UNIQUE("platform_code")
);
--> statement-breakpoint
CREATE TABLE "vacancy_responses" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"resume_id" varchar(100) NOT NULL,
	"resume_url" text NOT NULL,
	"candidate_name" varchar(500),
	"telegram_username" varchar(100),
	"chat_id" varchar(100),
	"cover_letter" text,
	"status" "response_status" DEFAULT 'NEW' NOT NULL,
	"hr_selection_status" "hr_selection_status",
	"import_source" "import_source" DEFAULT 'HH_API',
	"platform_profile_url" text,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "score_check" CHECK ("response_screenings"."score" BETWEEN 0 AND 5),
	CONSTRAINT "detailed_score_check" CHECK ("response_screenings"."detailed_score" BETWEEN 0 AND 100)
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
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
CREATE TABLE "workspaces" (
	"id" text PRIMARY KEY DEFAULT workspace_id_generate() NOT NULL,
	"external_id" varchar(100),
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"website" text,
	"logo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
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
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "workspace_members" (
	"user_id" text NOT NULL,
	"workspace_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_members_user_id_workspace_id_pk" PRIMARY KEY("user_id","workspace_id")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_organization_id_organizations_id_fk" FOREIGN KEY ("last_active_organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_last_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("last_active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buffered_messages" ADD CONSTRAINT "buffered_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_gig_response_id_gig_responses_id_fk" FOREIGN KEY ("gig_response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_media" ADD CONSTRAINT "gig_interview_media_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_interview_links" ADD CONSTRAINT "gig_interview_links_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_invitations" ADD CONSTRAINT "gig_invitations_response_id_gig_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_portfolio_file_id_files_id_fk" FOREIGN KEY ("portfolio_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_response_screenings" ADD CONSTRAINT "gig_response_screenings_response_id_gig_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrations" ADD CONSTRAINT "integrations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_invited_user_id_users_id_fk" FOREIGN KEY ("invited_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_invites" ADD CONSTRAINT "organization_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_members" ADD CONSTRAINT "organization_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_prequalification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."prequalification_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outgoing_messages" ADD CONSTRAINT "outgoing_messages_gig_response_id_gig_responses_id_fk" FOREIGN KEY ("gig_response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outgoing_messages" ADD CONSTRAINT "outgoing_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_sessions" ADD CONSTRAINT "telegram_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_invitations" ADD CONSTRAINT "freelance_invitations_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_links" ADD CONSTRAINT "interview_links_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_resume_pdf_file_id_files_id_fk" FOREIGN KEY ("resume_pdf_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD CONSTRAINT "vacancy_responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_comments" ADD CONSTRAINT "vacancy_response_comments_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_comments" ADD CONSTRAINT "vacancy_response_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancy_response_history" ADD CONSTRAINT "vacancy_response_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "response_screenings" ADD CONSTRAINT "response_screenings_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_created_at_idx" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "company_settings_workspace_idx" ON "company_settings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "buffered_message_conversation_step_idx" ON "buffered_messages" USING btree ("conversation_id","interview_step");--> statement-breakpoint
CREATE INDEX "buffered_message_user_idx" ON "buffered_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "buffered_message_id_idx" ON "buffered_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_message_timestamp_idx" ON "buffered_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "conversation_status_idx" ON "conversations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "conversation_active_idx" ON "conversations" USING btree ("status") WHERE "conversations"."status" = 'ACTIVE';--> statement-breakpoint
CREATE INDEX "conversation_gig_response_idx" ON "conversations" USING btree ("gig_response_id");--> statement-breakpoint
CREATE INDEX "message_conversation_idx" ON "conversation_messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "message_sender_idx" ON "conversation_messages" USING btree ("sender");--> statement-breakpoint
CREATE INDEX "message_channel_idx" ON "conversation_messages" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "message_conversation_created_idx" ON "conversation_messages" USING btree ("conversation_id","created_at");--> statement-breakpoint
CREATE INDEX "file_key_idx" ON "files" USING btree ("key");--> statement-breakpoint
CREATE INDEX "file_provider_key_idx" ON "files" USING btree ("provider","key");--> statement-breakpoint
CREATE INDEX "gig_workspace_idx" ON "gigs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gig_type_idx" ON "gigs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gig_active_idx" ON "gigs" USING btree ("workspace_id","is_active") WHERE "gigs"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_source_external_idx" ON "gigs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "gig_deadline_idx" ON "gigs" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "gig_interview_media_gig_idx" ON "gig_interview_media" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_interview_media_file_idx" ON "gig_interview_media" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "gig_interview_link_gig_idx" ON "gig_interview_links" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_interview_link_token_idx" ON "gig_interview_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "gig_interview_link_active_idx" ON "gig_interview_links" USING btree ("gig_id","is_active") WHERE "gig_interview_links"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_invitation_response_idx" ON "gig_invitations" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "gig_invitation_created_at_idx" ON "gig_invitations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gig_response_gig_idx" ON "gig_responses" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_response_status_idx" ON "gig_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gig_response_hr_status_idx" ON "gig_responses" USING btree ("hr_selection_status");--> statement-breakpoint
CREATE INDEX "gig_response_import_source_idx" ON "gig_responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "gig_response_gig_status_idx" ON "gig_responses" USING btree ("gig_id","status");--> statement-breakpoint
CREATE INDEX "gig_response_profile_url_idx" ON "gig_responses" USING btree ("profile_url");--> statement-breakpoint
CREATE INDEX "gig_screening_response_idx" ON "gig_response_screenings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "gig_screening_score_idx" ON "gig_response_screenings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "gig_screening_detailed_score_idx" ON "gig_response_screenings" USING btree ("detailed_score");--> statement-breakpoint
CREATE INDEX "integration_workspace_idx" ON "integrations" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "integration_type_idx" ON "integrations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "integration_active_idx" ON "integrations" USING btree ("workspace_id","is_active") WHERE "integrations"."is_active" = true;--> statement-breakpoint
CREATE INDEX "organization_invite_organization_idx" ON "organization_invites" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_invite_token_idx" ON "organization_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "organization_invite_expires_idx" ON "organization_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "organization_member_user_idx" ON "organization_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organization_member_organization_idx" ON "organization_members" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "organization_member_role_idx" ON "organization_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "analytics_workspace_idx" ON "analytics_events" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "analytics_vacancy_idx" ON "analytics_events" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "analytics_event_type_idx" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "analytics_timestamp_idx" ON "analytics_events" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "analytics_workspace_timestamp_idx" ON "analytics_events" USING btree ("workspace_id","timestamp");--> statement-breakpoint
CREATE INDEX "analytics_vacancy_timestamp_idx" ON "analytics_events" USING btree ("vacancy_id","timestamp");--> statement-breakpoint
CREATE INDEX "custom_domain_workspace_idx" ON "custom_domains" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "custom_domain_domain_idx" ON "custom_domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "preq_session_workspace_idx" ON "prequalification_sessions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "preq_session_vacancy_idx" ON "prequalification_sessions" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "preq_session_status_idx" ON "prequalification_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "preq_session_fit_score_idx" ON "prequalification_sessions" USING btree ("fit_score");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_idx" ON "agent_feedback" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_idx" ON "agent_feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_feedback_type_idx" ON "agent_feedback" USING btree ("feedback_type");--> statement-breakpoint
CREATE INDEX "agent_feedback_workspace_created_at_idx" ON "agent_feedback" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_feedback_user_workspace_idx" ON "agent_feedback" USING btree ("user_id","workspace_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_conversation_idx" ON "buffered_temp_messages" USING btree ("temp_conversation_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_chat_idx" ON "buffered_temp_messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_id_idx" ON "buffered_temp_messages" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "buffered_temp_message_timestamp_idx" ON "buffered_temp_messages" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "outgoing_message_gig_response_idx" ON "outgoing_messages" USING btree ("gig_response_id");--> statement-breakpoint
CREATE INDEX "outgoing_message_status_idx" ON "outgoing_messages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "outgoing_message_sender_idx" ON "outgoing_messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "outgoing_message_recipient_idx" ON "outgoing_messages" USING btree ("recipient_telegram_username");--> statement-breakpoint
CREATE INDEX "outgoing_message_status_created_idx" ON "outgoing_messages" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "freelance_import_vacancy_idx" ON "freelance_import_history" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "freelance_import_user_idx" ON "freelance_import_history" USING btree ("imported_by");--> statement-breakpoint
CREATE INDEX "freelance_import_platform_idx" ON "freelance_import_history" USING btree ("platform_source");--> statement-breakpoint
CREATE INDEX "freelance_import_created_idx" ON "freelance_import_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "invitation_response_idx" ON "freelance_invitations" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "invitation_created_at_idx" ON "freelance_invitations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "interview_link_vacancy_idx" ON "interview_links" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "interview_link_token_idx" ON "interview_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "interview_link_active_idx" ON "interview_links" USING btree ("vacancy_id","is_active") WHERE "interview_links"."is_active" = true;--> statement-breakpoint
CREATE INDEX "platform_config_code_idx" ON "platform_config" USING btree ("platform_code");--> statement-breakpoint
CREATE INDEX "platform_config_active_idx" ON "platform_config" USING btree ("is_active") WHERE "platform_config"."is_active" = true;--> statement-breakpoint
CREATE INDEX "response_vacancy_idx" ON "vacancy_responses" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "response_status_idx" ON "vacancy_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "response_hr_status_idx" ON "vacancy_responses" USING btree ("hr_selection_status");--> statement-breakpoint
CREATE INDEX "response_import_source_idx" ON "vacancy_responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "response_platform_profile_idx" ON "vacancy_responses" USING btree ("platform_profile_url");--> statement-breakpoint
CREATE INDEX "response_vacancy_status_idx" ON "vacancy_responses" USING btree ("vacancy_id","status");--> statement-breakpoint
CREATE INDEX "response_vacancy_platform_idx" ON "vacancy_responses" USING btree ("vacancy_id","platform_profile_url");--> statement-breakpoint
CREATE INDEX "screening_response_idx" ON "response_screenings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "screening_score_idx" ON "response_screenings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "screening_detailed_score_idx" ON "response_screenings" USING btree ("detailed_score");--> statement-breakpoint
CREATE INDEX "vacancy_workspace_idx" ON "vacancies" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "vacancy_active_idx" ON "vacancies" USING btree ("workspace_id","is_active") WHERE "vacancies"."is_active" = true;--> statement-breakpoint
CREATE INDEX "vacancy_source_external_idx" ON "vacancies" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "workspace_organization_idx" ON "workspaces" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_workspace_idx" ON "workspace_invites" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_invite_token_idx" ON "workspace_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "workspace_invite_expires_idx" ON "workspace_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "workspace_member_user_idx" ON "workspace_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspace_member_workspace_idx" ON "workspace_members" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspace_member_role_idx" ON "workspace_members" USING btree ("role");