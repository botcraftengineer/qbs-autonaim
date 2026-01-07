ALTER TABLE "gig_interview_links" DROP CONSTRAINT "gig_interview_links_slug_unique";--> statement-breakpoint
ALTER TABLE "interview_links" DROP CONSTRAINT "interview_links_slug_unique";--> statement-breakpoint
DROP INDEX "gig_interview_link_slug_idx";--> statement-breakpoint
DROP INDEX "interview_link_slug_idx";--> statement-breakpoint
ALTER TABLE "gig_interview_links" DROP COLUMN "slug";--> statement-breakpoint
ALTER TABLE "interview_links" DROP COLUMN "slug";