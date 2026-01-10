CREATE TYPE "public"."gig_recommendation" AS ENUM('HIGHLY_RECOMMENDED', 'RECOMMENDED', 'NEUTRAL', 'NOT_RECOMMENDED');--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "composite_score" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "price_score" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "delivery_score" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "skills_match_score" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "experience_score" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "ranking_position" integer;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "ranking_analysis" text;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "strengths" jsonb;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "weaknesses" jsonb;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "recommendation" "gig_recommendation";--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "ranked_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "gig_response_composite_score_idx" ON "gig_responses" USING btree ("composite_score");--> statement-breakpoint
CREATE INDEX "gig_response_recommendation_idx" ON "gig_responses" USING btree ("recommendation");--> statement-breakpoint
CREATE INDEX "gig_response_ranking_position_idx" ON "gig_responses" USING btree ("ranking_position");