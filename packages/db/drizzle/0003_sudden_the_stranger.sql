ALTER TYPE "public"."hr_selection_status" ADD VALUE 'SECURITY_PASSED';--> statement-breakpoint
ALTER TYPE "public"."hr_selection_status" ADD VALUE 'CONTRACT_SENT';--> statement-breakpoint
ALTER TYPE "public"."hr_selection_status" ADD VALUE 'ONBOARDING';--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DEFAULT 'NEW'::text;--> statement-breakpoint
DROP TYPE "public"."response_status";--> statement-breakpoint
CREATE TYPE "public"."response_status" AS ENUM('NEW', 'EVALUATED', 'INTERVIEW_HH', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DEFAULT 'NEW'::"public"."response_status";--> statement-breakpoint
ALTER TABLE "vacancy_responses" ALTER COLUMN "status" SET DATA TYPE "public"."response_status" USING "status"::"public"."response_status";