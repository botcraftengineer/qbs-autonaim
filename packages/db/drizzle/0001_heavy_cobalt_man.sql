CREATE TYPE "public"."gig_type" AS ENUM('DEVELOPMENT', 'DESIGN', 'COPYWRITING', 'MARKETING', 'TRANSLATION', 'VIDEO', 'AUDIO', 'DATA_ENTRY', 'RESEARCH', 'CONSULTING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."gig_hr_selection_status" AS ENUM('INVITE', 'RECOMMENDED', 'NOT_RECOMMENDED', 'REJECTED', 'SELECTED', 'CONTRACT_SENT', 'IN_PROGRESS', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."gig_import_source" AS ENUM('MANUAL', 'KWORK', 'FL_RU', 'WEBLANCER', 'UPWORK', 'FREELANCE_RU', 'WEB_LINK');--> statement-breakpoint
CREATE TYPE "public"."gig_response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'NEGOTIATION', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
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
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_portfolio_file_id_files_id_fk" FOREIGN KEY ("portfolio_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD CONSTRAINT "gig_responses_photo_file_id_files_id_fk" FOREIGN KEY ("photo_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_response_screenings" ADD CONSTRAINT "gig_response_screenings_response_id_gig_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gig_workspace_idx" ON "gigs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "gig_type_idx" ON "gigs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gig_active_idx" ON "gigs" USING btree ("workspace_id","is_active") WHERE "gigs"."is_active" = true;--> statement-breakpoint
CREATE INDEX "gig_source_external_idx" ON "gigs" USING btree ("source","external_id");--> statement-breakpoint
CREATE INDEX "gig_deadline_idx" ON "gigs" USING btree ("deadline");--> statement-breakpoint
CREATE INDEX "gig_response_gig_idx" ON "gig_responses" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_response_status_idx" ON "gig_responses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gig_response_hr_status_idx" ON "gig_responses" USING btree ("hr_selection_status");--> statement-breakpoint
CREATE INDEX "gig_response_import_source_idx" ON "gig_responses" USING btree ("import_source");--> statement-breakpoint
CREATE INDEX "gig_response_gig_status_idx" ON "gig_responses" USING btree ("gig_id","status");--> statement-breakpoint
CREATE INDEX "gig_response_profile_url_idx" ON "gig_responses" USING btree ("profile_url");--> statement-breakpoint
CREATE INDEX "gig_screening_response_idx" ON "gig_response_screenings" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "gig_screening_score_idx" ON "gig_response_screenings" USING btree ("score");--> statement-breakpoint
CREATE INDEX "gig_screening_detailed_score_idx" ON "gig_response_screenings" USING btree ("detailed_score");