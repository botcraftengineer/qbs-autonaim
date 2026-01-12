ALTER TABLE "workspaces" ADD COLUMN "custom_domain_id" uuid;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_custom_domain_id_custom_domains_id_fk" FOREIGN KEY ("custom_domain_id") REFERENCES "public"."custom_domains"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" DROP COLUMN "interview_domain";