import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vacancyResponse } from "./response";

/**
 * Таблица для хранения приглашений на интервью для фрилансеров
 */
export const freelanceInvitation = pgTable(
  "freelance_invitations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => vacancyResponse.id, { onDelete: "cascade" }),
    invitationText: text("invitation_text").notNull(),
    interviewUrl: text("interview_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    responseIdx: index("invitation_response_idx").on(table.responseId),
    createdAtIdx: index("invitation_created_at_idx").on(table.createdAt),
  }),
);

export const CreateFreelanceInvitationSchema = createInsertSchema(
  freelanceInvitation,
  {
    responseId: z.string().uuid(),
    invitationText: z.string().min(1),
    interviewUrl: z.string().url(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type FreelanceInvitation = typeof freelanceInvitation.$inferSelect;
