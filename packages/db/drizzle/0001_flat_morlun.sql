CREATE TYPE "public"."audit_action" AS ENUM('VIEW', 'EXPORT', 'UPDATE', 'DELETE', 'ACCESS');--> statement-breakpoint
CREATE TYPE "public"."audit_resource_type" AS ENUM('VACANCY_RESPONSE', 'CONVERSATION', 'RESUME', 'CONTACT_INFO', 'VACANCY');--> statement-breakpoint
CREATE TYPE "public"."conversation_source" AS ENUM('TELEGRAM', 'WEB');--> statement-breakpoint
CREATE TYPE "public"."import_mode" AS ENUM('SINGLE', 'BULK');--> statement-breakpoint
CREATE TYPE "public"."import_source" AS ENUM('HH_API', 'FREELANCE_MANUAL', 'FREELANCE_LINK');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"user_id" text NOT NULL,
	"action" "audit_action" NOT NULL,
	"resource_type" "audit_resource_type" NOT NULL,
	"resource_id" uuid NOT NULL,
	"metadata" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_scorings" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"response_id" uuid,
	"score" integer NOT NULL,
	"detailed_score" integer NOT NULL,
	"analysis" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "interview_scorings_conversation_id_unique" UNIQUE("conversation_id")
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
ALTER TABLE "conversations" ADD COLUMN "source" "conversation_source" DEFAULT 'TELEGRAM' NOT NULL;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD COLUMN "import_source" "import_source" DEFAULT 'HH_API';--> statement-breakpoint
ALTER TABLE "vacancy_responses" ADD COLUMN "platform_profile_url" text;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scorings" ADD CONSTRAINT "interview_scorings_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_import_history" ADD CONSTRAINT "freelance_import_history_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "freelance_invitations" ADD CONSTRAINT "freelance_invitations_response_id_vacancy_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."vacancy_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_links" ADD CONSTRAINT "interview_links_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_resource_idx" ON "audit_logs" USING btree ("resource_type","resource_id");--> statement-breakpoint
CREATE INDEX "audit_log_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_user_created_at_idx" ON "audit_logs" USING btree ("user_id","created_at");--> statement-breakpoint
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
CREATE INDEX "response_import_source_idx" ON "vacancy_responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "response_platform_profile_idx" ON "vacancy_responses" USING btree ("platform_profile_url");--> statement-breakpoint
CREATE INDEX "response_vacancy_platform_idx" ON "vacancy_responses" USING btree ("vacancy_id","platform_profile_url");