ALTER TABLE "gigs" ADD COLUMN "custom_domain_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD COLUMN "interview_domain" text;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_custom_domain_id_custom_domains_id_fk" FOREIGN KEY ("custom_domain_id") REFERENCES "public"."custom_domains"("id") ON DELETE set null ON UPDATE no action;