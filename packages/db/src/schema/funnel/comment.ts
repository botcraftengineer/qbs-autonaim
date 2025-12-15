import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { funnelCandidate } from "./candidate";

export const funnelComment = pgTable(
  "funnel_comments",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => funnelCandidate.id, { onDelete: "cascade" }),

    author: varchar("author", { length: 255 }).notNull(),
    authorAvatar: text("author_avatar"),
    content: text("content").notNull(),
    isPrivate: boolean("is_private").notNull().default(false),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    candidateIdx: index("funnel_comment_candidate_idx").on(table.candidateId),
  })
);
