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

/**
 * @deprecated Use universal interviewLink instead
 * Kept for backward compatibility with existing vacancy-specific code
 */
export const vacancyInterviewLink = pgTable(
  "vacancy_interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    vacancyIdx: index("vacancy_interview_link_vacancy_idx").on(table.vacancyId),
    tokenIdx: index("vacancy_interview_link_token_idx").on(table.token),
    activeIdx: index("vacancy_interview_link_active_idx")
      .on(table.vacancyId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export const CreateVacancyInterviewLinkSchema = createInsertSchema(
  vacancyInterviewLink,
  {
    token: z.string().max(100),
    isActive: z.boolean().default(true),
    expiresAt: z.date().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type VacancyInterviewLink = typeof vacancyInterviewLink.$inferSelect;
