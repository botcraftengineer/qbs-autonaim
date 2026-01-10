import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { gig } from "./gig";

/**
 * Таблица сессий чата для gig заданий
 */
export const gigChatSession = pgTable(
  "gig_chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    gigUserUnique: unique("gig_chat_session_gig_user_unique").on(
      table.gigId,
      table.userId,
    ),
    gigIdx: index("gig_chat_session_gig_idx").on(table.gigId),
    userIdx: index("gig_chat_session_user_idx").on(table.userId),
  }),
);

/**
 * Роль сообщения в чате
 */
export const gigChatMessageRoleEnum = pgEnum("gig_chat_message_role", [
  "user",
  "assistant",
]);

/**
 * Метаданные сообщения
 */
export interface GigChatMessageMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  candidatesMentioned?: string[];
}

/**
 * Таблица сообщений в чате
 */
export const gigChatMessage = pgTable(
  "gig_chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => gigChatSession.id, { onDelete: "cascade" }),
    role: gigChatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    quickReplies: jsonb("quick_replies").$type<string[]>(),
    metadata: jsonb("metadata").$type<GigChatMessageMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("gig_chat_message_session_idx").on(table.sessionId),
    sessionCreatedIdx: index("gig_chat_message_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
  }),
);

export type GigChatSession = typeof gigChatSession.$inferSelect;
export type NewGigChatSession = typeof gigChatSession.$inferInsert;
export type GigChatMessage = typeof gigChatMessage.$inferSelect;
export type NewGigChatMessage = typeof gigChatMessage.$inferInsert;
