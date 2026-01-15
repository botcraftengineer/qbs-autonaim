CREATE TABLE "interview_scenarios" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"workspace_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text,
	"custom_bot_instructions" text,
	"custom_screening_prompt" text,
	"custom_interview_questions" text,
	"custom_organizational_questions" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gigs" ADD COLUMN "interview_scenario_id" uuid;--> statement-breakpoint
ALTER TABLE "interview_scenarios" ADD CONSTRAINT "interview_scenarios_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_scenario_workspace_idx" ON "interview_scenarios" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "interview_scenario_active_idx" ON "interview_scenarios" USING btree ("workspace_id","is_active") WHERE "interview_scenarios"."is_active" = true;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_interview_scenario_id_interview_scenarios_id_fk" FOREIGN KEY ("interview_scenario_id") REFERENCES "public"."interview_scenarios"("id") ON DELETE set null ON UPDATE no action;