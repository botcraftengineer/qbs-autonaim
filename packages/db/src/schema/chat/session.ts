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

/**
 * Тип сущности для чата (расширяемый)
 */
export const chatEntityTypeEnum = pgEnum("chat_entity_type", [
  "gig",
  "vacancy",
  "project",
  "team",
]);

/**
 * Универсальная таблица сессий чата
 * Поддерживает чаты для любых типов сущностей через полиморфную связь
 */
export const chatSession = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    entityType: chatEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    userId: text("user_id").notNull(),
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    entityUserUnique: unique("chat_session_entity_user_unique").on(
      table.entityType,
      table.entityId,
      table.userId,
    ),
    entityTypeIdx: index("chat_session_entity_type_idx").on(table.entityType),
    entityIdx: index("chat_session_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    userIdx: index("chat_session_user_idx").on(table.userId),
  }),
);

/**
 * Роль сообщения в чате
 */
export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
]);

/**
 * Метаданные сообщения
 */
export interface ChatMessageMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
  entitiesMentioned?: string[];
  analysisType?: string;
  [key: string]: unknown;
}

/**
 * Универсальная таблица сообщений в чате
 */
export const chatMessage = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSession.id, { onDelete: "cascade" }),
    role: chatMessageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    quickReplies: jsonb("quick_replies").$type<string[]>(),
    metadata: jsonb("metadata").$type<ChatMessageMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("chat_message_session_idx").on(table.sessionId),
    sessionCreatedIdx: index("chat_message_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
  }),
);

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type ChatEntityType = (typeof chatEntityTypeEnum.enumValues)[number];
export type ChatMessageRole = (typeof chatMessageRoleEnum.enumValues)[number];
