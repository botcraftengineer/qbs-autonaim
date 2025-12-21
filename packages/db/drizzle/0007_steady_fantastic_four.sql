ALTER TABLE "vacancies" ADD COLUMN "source" text DEFAULT 'hh' NOT NULL;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "external_id" varchar(100);