ALTER TYPE "public"."response_event_type" ADD VALUE 'OFFER_SENT' BEFORE 'COMMENT_ADDED';--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DEFAULT 'NEW'::text;--> statement-breakpoint
UPDATE "vacancy_responses" SET "status" = 'INTERVIEW' WHERE "status" = 'INTERVIEW_HH';--> statement-breakpoint
DROP TYPE "public"."response_status";--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DEFAULT 'NEW'::"public"."response_status";--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DATA TYPE "public"."response_status" USING "status"::"public"."response_status";