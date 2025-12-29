ALTER TABLE "telegram_interview_scorings" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "telegram_interview_scorings" CASCADE;--> statement-breakpoint
ALTER TABLE "interview_links" ADD COLUMN "slug" varchar(100) NOT NULL;--> statement-breakpoint
CREATE INDEX "interview_link_slug_idx" ON "interview_links" USING btree ("slug");--> statement-breakpoint
ALTER TABLE "interview_links" ADD CONSTRAINT "interview_links_slug_unique" UNIQUE("slug");