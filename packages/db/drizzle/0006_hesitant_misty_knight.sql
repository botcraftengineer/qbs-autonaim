CREATE TABLE "vacancy_publications" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"vacancy_id" uuid NOT NULL,
	"platform" "platform_source" NOT NULL,
	"external_id" varchar(100),
	"url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "responses" ADD COLUMN "publication_id" uuid;--> statement-breakpoint
ALTER TABLE "vacancy_publications" ADD CONSTRAINT "vacancy_publications_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vacancy_publication_vacancy_idx" ON "vacancy_publications" USING btree ("vacancy_id");--> statement-breakpoint
CREATE INDEX "vacancy_publication_platform_external_idx" ON "vacancy_publications" USING btree ("platform","external_id");--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_publication_id_vacancy_publications_id_fk" FOREIGN KEY ("publication_id") REFERENCES "public"."vacancy_publications"("id") ON DELETE set null ON UPDATE no action;