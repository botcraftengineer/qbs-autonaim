import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { response } from "./response";

/**
 * Универсальная таблица для хранения приглашений на интервью
 * Работает для gig, vacancy и других типов
 */
export const responseInvitation = pgTable(
  "response_invitations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    invitationText: text("invitation_text").notNull(),
    interviewUrl: text("interview_url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    responseIdx: index("invitation_response_idx").on(table.responseId),
    createdAtIdx: index("invitation_created_at_idx").on(table.createdAt),
  }),
);

export type ResponseInvitation = typeof responseInvitation.$inferSelect;
export type NewResponseInvitation = typeof responseInvitation.$inferInsert;
