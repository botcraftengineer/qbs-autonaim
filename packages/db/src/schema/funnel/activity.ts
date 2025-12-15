import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { funnelCandidate } from "./candidate";

export const funnelActivity = pgTable(
  "funnel_activities",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => funnelCandidate.id, { onDelete: "cascade" }),

    type: varchar("type", { length: 50 }).notNull(),
    description: text("description").notNull(),
    author: varchar("author", { length: 255 }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    candidateIdx: index("funnel_activity_candidate_idx").on(table.candidateId),
  })
);
