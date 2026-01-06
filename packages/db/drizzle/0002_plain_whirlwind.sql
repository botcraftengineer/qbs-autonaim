CREATE TABLE "gig_invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuid_generate_v7() NOT NULL,
	"response_id" uuid NOT NULL,
	"invitation_text" text NOT NULL,
	"interview_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gig_invitations" ADD CONSTRAINT "gig_invitations_response_id_gig_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gig_invitation_response_idx" ON "gig_invitations" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "gig_invitation_created_at_idx" ON "gig_invitations" USING btree ("created_at");