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

import { gig } from "./gig";

/**
 * Ссылки на интервью для гигов
 * Генерируются ботом для приглашения кандидатов в чат
 */
export const gigInterviewLink = pgTable(
  "gig_interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 100 }).notNull().unique(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  },
  (table) => ({
    gigIdx: index("gig_interview_link_gig_idx").on(table.gigId),
    tokenIdx: index("gig_interview_link_token_idx").on(table.token),
    slugIdx: index("gig_interview_link_slug_idx").on(table.slug),
    activeIdx: index("gig_interview_link_active_idx")
      .on(table.gigId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export const CreateGigInterviewLinkSchema = createInsertSchema(
  gigInterviewLink,
  {
    token: z.string().max(100),
    slug: z.string().max(100),
    isActive: z.boolean().default(true),
    expiresAt: z.date().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type GigInterviewLink = typeof gigInterviewLink.$inferSelect;
