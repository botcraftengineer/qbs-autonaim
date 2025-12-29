import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { vacancy } from "./vacancy";

export const interviewLink = pgTable(
  "interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    vacancyIdx: index("interview_link_vacancy_idx").on(table.vacancyId),
    tokenIdx: index("interview_link_token_idx").on(table.token),
    slugIdx: index("interview_link_slug_idx").on(table.slug),
    activeIdx: index("interview_link_active_idx")
      .on(table.vacancyId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export const CreateInterviewLinkSchema = createInsertSchema(interviewLink, {
  token: z.string().max(100),
  slug: z.string().max(100),
  isActive: z.boolean().default(true),
  expiresAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InterviewLink = typeof interviewLink.$inferSelect;
