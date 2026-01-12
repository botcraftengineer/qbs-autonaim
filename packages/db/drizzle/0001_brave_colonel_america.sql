ALTER TABLE "custom_domains" ALTER COLUMN "workspace_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "custom_domains" ADD COLUMN "is_preset" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "custom_domain_preset_idx" ON "custom_domains" USING btree ("is_preset","type") WHERE "custom_domains"."is_preset" = true;