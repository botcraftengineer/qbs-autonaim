CREATE TABLE "gig_interview_links" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"gig_id" uuid NOT NULL,
	"token" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "gig_interview_links_token_unique" UNIQUE("token"),
	CONSTRAINT "gig_interview_links_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "gig_interview_links" ADD CONSTRAINT "gig_interview_links_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gig_interview_link_gig_idx" ON "gig_interview_links" USING btree ("gig_id");--> statement-breakpoint
CREATE INDEX "gig_interview_link_token_idx" ON "gig_interview_links" USING btree ("token");--> statement-breakpoint
CREATE INDEX "gig_interview_link_slug_idx" ON "gig_interview_links" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gig_interview_link_active_idx" ON "gig_interview_links" USING btree ("gig_id","is_active") WHERE "gig_interview_links"."is_active" = true;