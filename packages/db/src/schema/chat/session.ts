import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { file } from "../file/file";

/**
 * Тип сущности для командных чатов
 * НЕ включает интервью - для них есть interviewSession
 */
export const chatEntityTypeEnum = pgEnum("chat_entity_type", [
  "gig", // Чат по гигу (заказчик-исполнитель)
  "vacancy", // Чат команды по вакансии
  "project", // Общий чат проекта
  "team", // Чат команды
]);

export const chatStatusEnum = pgEnum("chat_status", [
  "active",
  "archived",
  "blocked",
]);

export const chatChannelEnum = pgEnum("chat_channel", ["web", "email"]);

/**
 * Командные чаты (НЕ интервью)
 * Для общения команды по вакансиям, гигам, проектам
 * Также используется для персональных AI-чатов по сущностям
 */
export const chatSession = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь
    entityType: chatEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // ID вакансии, гига, проекта

    // Пользователь (для персональных AI-чатов)
    userId: text("user_id"),

    // Заголовок чата
    title: varchar("title", { length: 500 }),

    // Статус
    status: chatStatusEnum("status").default("active").notNull(),

    // Счётчики
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

    // Метаданные
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
    entityTypeIdx: index("chat_session_entity_type_idx").on(table.entityType),
    entityIdx: index("chat_session_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    userIdx: index("chat_session_user_idx").on(table.userId),
    entityUserIdx: index("chat_session_entity_user_idx").on(
      table.entityType,
      table.entityId,
      table.userId,
    ),
    statusIdx: index("chat_session_status_idx").on(table.status),
  }),
);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user", // Участник команды
  "assistant", // AI ассистент
  "admin", // Админ/рекрутер
  "system", // Системные сообщения
]);

export const chatMessageTypeEnum = pgEnum("chat_message_type", [
  "text",
  "file",
  "event", // Системные события
]);

export interface ChatMessageMetadata {
  isRead?: boolean;
  editedAt?: string;
  latencyMs?: number;
  entitiesMentioned?: string[];
  [key: string]: unknown;
}

/**
 * Сообщения в командных чатах
 */
export const chatMessage = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSession.id, { onDelete: "cascade" }),

    // Отправитель
    userId: text("user_id").notNull(), // Clerk user ID
    role: chatMessageRoleEnum("role").notNull(),
    type: chatMessageTypeEnum("type").default("text").notNull(),

    // Контент
    content: text("content"),

    // Quick replies для AI чатов
    quickReplies: jsonb("quick_replies").$type<string[]>(),

    // Файлы
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),

    // Метаданные
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
    userIdx: index("chat_message_user_idx").on(table.userId),
  }),
);

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type ChatEntityType = (typeof chatEntityTypeEnum.enumValues)[number];
