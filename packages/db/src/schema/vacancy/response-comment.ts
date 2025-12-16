import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { user } from "../auth";
import { vacancyResponse } from "./response";

export const vacancyResponseComment = pgTable("vacancy_response_comments", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  responseId: uuid("response_id")
    .notNull()
    .references(() => vacancyResponse.id, { onDelete: "cascade" }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isPrivate: boolean("is_private").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .$onUpdate(() => new Date())
    .notNull(),
});

export const CreateVacancyResponseCommentSchema = createInsertSchema(
  vacancyResponseComment,
  {
    responseId: z.string().uuid(),
    authorId: z.string().uuid(),
    content: z.string().min(1),
    isPrivate: z.boolean().default(true),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyResponseComment = typeof vacancyResponseComment.$inferSelect;
