ALTER TABLE "conversations" ADD COLUMN "gig_response_id" uuid;--> statement-breakpoint
ALTER TABLE "gig_responses" ADD COLUMN "resume_language" varchar(10) DEFAULT 'ru';--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_gig_response_id_gig_responses_id_fk" FOREIGN KEY ("gig_response_id") REFERENCES "public"."gig_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conversation_gig_response_idx" ON "conversations" USING btree ("gig_response_id");--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_gig_response_id_unique" UNIQUE("gig_response_id");