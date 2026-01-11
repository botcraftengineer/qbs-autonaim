import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { response } from "./response";

/**
 * Приглашения на интервью
 */
export const responseInvitation = pgTable(
  "response_invitations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),

    // Текст приглашения
    invitationText: text("invitation_text"),

    // Ссылка на интервью
    interviewUrl: text("interview_url"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("response_invitation_response_idx").on(table.responseId)],
);

export const CreateResponseInvitationSchema = createInsertSchema(
  responseInvitation,
  {
    responseId: z.string().uuid(),
    invitationText: z.string().optional(),
    interviewUrl: z.string().url().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type ResponseInvitation = typeof responseInvitation.$inferSelect;
export type NewResponseInvitation = typeof responseInvitation.$inferInsert;
