import { relations, sql } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { user } from "../auth";
import { vacancyResponse } from "./response";

export const responseEventTypeEnum = pgEnum("response_event_type", [
  "STATUS_CHANGED",
  "HR_STATUS_CHANGED",
  "TELEGRAM_USERNAME_ADDED",
  "CHAT_ID_ADDED",
  "PHONE_ADDED",
  "RESUME_UPDATED",
  "PHOTO_ADDED",
  "WELCOME_SENT",
  "OFFER_SENT",
  "COMMENT_ADDED",
  "SALARY_UPDATED",
  "CONTACT_INFO_UPDATED",
  "CREATED",
]);

export const vacancyResponseHistory = pgTable("vacancy_response_history", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  responseId: uuid("response_id")
    .notNull()
    .references(() => vacancyResponse.id, { onDelete: "cascade" }),
  eventType: responseEventTypeEnum("event_type").notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const CreateVacancyResponseHistorySchema = createInsertSchema(
  vacancyResponseHistory,
  {
    responseId: z.string().uuid(),
    eventType: z.enum([
      "STATUS_CHANGED",
      "HR_STATUS_CHANGED",
      "TELEGRAM_USERNAME_ADDED",
      "CHAT_ID_ADDED",
      "PHONE_ADDED",
      "RESUME_UPDATED",
      "PHOTO_ADDED",
      "WELCOME_SENT",
      "OFFER_SENT",
      "COMMENT_ADDED",
      "SALARY_UPDATED",
      "CONTACT_INFO_UPDATED",
      "CREATED",
    ]),
    userId: z.string().optional(),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    metadata: z.any().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type VacancyResponseHistory = typeof vacancyResponseHistory.$inferSelect;

export const vacancyResponseHistoryRelations = relations(
  vacancyResponseHistory,
  ({ one }) => ({
    response: one(vacancyResponse, {
      fields: [vacancyResponseHistory.responseId],
      references: [vacancyResponse.id],
    }),
    user: one(user, {
      fields: [vacancyResponseHistory.userId],
      references: [user.id],
    }),
  }),
);
