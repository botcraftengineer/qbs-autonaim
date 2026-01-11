import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { gigResponse } from "./response";

/**
 * Таблица для хранения приглашений на интервью для откликов на гиги
 */
export const gigInvitation = pgTable(
  "gig_invitations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => gigResponse.id, { onDelete: "cascade" }),
    invitationText: text("invitation_text").notNull(),
    interviewUrl: text("interview_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    responseIdx: index("gig_invitation_response_idx").on(table.responseId),
    createdAtIdx: index("gig_invitation_created_at_idx").on(table.createdAt),
  }),
);

export const CreateGigInvitationSchema = createInsertSchema(gigInvitation, {
  responseId: z.uuid(),
  invitationText: z.string().min(1),
  interviewUrl: z.url(),
}).omit({
  id: true,
  createdAt: true,
});

export type GigInvitation = typeof gigInvitation.$inferSelect;
