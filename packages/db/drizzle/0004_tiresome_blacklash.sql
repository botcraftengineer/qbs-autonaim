CREATE TYPE "public"."domain_type" AS ENUM('interview', 'prequalification');--> statement-breakpoint
ALTER TABLE "custom_domains" RENAME COLUMN "verified" TO "is_verified";--> statement-breakpoint
ALTER TABLE "custom_domains" DROP CONSTRAINT "custom_domains_domain_unique";--> statement-breakpoint
ALTER TABLE "custom_domains" ALTER COLUMN "ssl_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "custom_domains" ALTER COLUMN "ssl_status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."ssl_status";--> statement-breakpoint
CREATE TYPE "public"."ssl_status" AS ENUM('pending', 'active', 'error', 'expired');--> statement-breakpoint
ALTER TABLE "custom_domains" ALTER COLUMN "ssl_status" SET DEFAULT 'pending'::"public"."ssl_status";--> statement-breakpoint
ALTER TABLE "custom_domains" ALTER COLUMN "ssl_status" SET DATA TYPE "public"."ssl_status" USING "ssl_status"::"public"."ssl_status";--> statement-breakpoint
ALTER TABLE "custom_domains" ALTER COLUMN "ssl_status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD COLUMN "type" "domain_type" DEFAULT 'interview' NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD COLUMN "is_primary" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD COLUMN "verification_token" varchar(100);--> statement-breakpoint
CREATE INDEX "custom_domain_type_idx" ON "custom_domains" USING btree ("type");--> statement-breakpoint
CREATE INDEX "custom_domain_primary_idx" ON "custom_domains" USING btree ("workspace_id","type","is_primary") WHERE "custom_domains"."is_primary" = true;--> statement-breakpoint
CREATE INDEX "custom_domain_unique_domain_type" ON "custom_domains" USING btree ("domain","type");