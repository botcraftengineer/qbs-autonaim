CREATE TYPE "public"."analytics_event_type" AS ENUM('widget_view', 'session_start', 'resume_upload', 'dialogue_message', 'dialogue_complete', 'evaluation_complete', 'application_submit');--> statement-breakpoint
CREATE TYPE "public"."ssl_status" AS ENUM('pending', 'active', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."fit_decision" AS ENUM('strong_fit', 'potential_fit', 'not_fit');--> statement-breakpoint
CREATE TYPE "public"."prequalification_source" AS ENUM('widget', 'direct');--> statement-breakpoint
CREATE TYPE "public"."prequalification_status" AS ENUM('consent_pending', 'resume_pending', 'dialogue_active', 'evaluating', 'completed', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."honesty_level" AS ENUM('direct', 'diplomatic', 'encouraging');--> statement-breakpoint
CREATE TYPE "public"."widget_tone" AS ENUM('formal', 'friendly');--> statement-breakpoint
CREATE TYPE "public"."agent_feedback_type" AS ENUM('accepted', 'rejected', 'modified', 'error_report');--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'CREATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'EVALUATE';--> statement-breakpoint
ALTER TYPE "public"."audit_action" ADD VALUE 'SUBMIT';--> statement-breakpoint
ALTER TYPE "public"."audit_resource_type" ADD VALUE 'PREQUALIFICATION_SESSION';--> statement-breakpoint
ALTER TYPE "public"."audit_resource_type" ADD VALUE 'WIDGET_CONFIG';--> statement-breakpoint
ALTER TYPE "public"."audit_resource_type" ADD VALUE 'CUSTOM_DOMAIN';--> statement-breakpoint
ALTER TYPE "public"."audit_resource_type" ADD VALUE 'RULE';--> statement-breakpoint
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
ALTER TABLE "audit_logs" ALTER COLUMN "resource_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "response_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "workspace_id" text;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_session_id_prequalification_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."prequalification_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prequalification_sessions" ADD CONSTRAINT "prequalification_sessions_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_configs" ADD CONSTRAINT "widget_configs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
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
CREATE INDEX "audit_log_workspace_idx" ON "audit_logs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "audit_log_workspace_created_at_idx" ON "audit_logs" USING btree ("workspace_id","created_at");