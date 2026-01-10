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
  varchar,
} from "drizzle-orm/pg-core";
import { file } from "../file/file";

/**
 * Тип сущности, к которой привязан чат.
 * Позволяет создать чат для чего угодно.
 */
export const chatEntityTypeEnum = pgEnum("chat_entity_type", [
  "gig", // Чат по гигу (заказчик-исполнитель)
  "vacancy", // Чат команды по вакансии
  "project", // Общий чат проекта
  "team", // Чат команды
  "vacancy_response", // Скрининг кандидата (вместо conversation)
  "gig_response", // Обсуждение отклика на гиг
]);

export const chatStatusEnum = pgEnum("chat_status", [
  "active",
  "completed",
  "archived",
  "blocked",
]);

export const chatChannelEnum = pgEnum("chat_channel", [
  "web",
  "telegram",
  "email",
  "whatsapp",
]);

/**
 * Универсальная таблица сессий чата
 */
export const chatSession = pgTable(
  "chat_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь
    entityType: chatEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // ID вакансии, отклика, проекта и т.д.

    // Основной участник (инициатор или кандидат)
    // Может быть null для командных чатов
    userId: text("user_id"),

    // Мета-информация
    status: chatStatusEnum("status").default("active").notNull(),
    // channel removed from session - session is agnostic
    lastChannel: chatChannelEnum("last_channel"), // Последний активный канал
    title: varchar("title", { length: 500 }), // Опциональный заголовок чата

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
    // Уникальность: один юзер - один чат в рамках сущности (например, один чат по отклику)
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
    statusIdx: index("chat_session_status_idx").on(table.status),
  }),
);

export const chatMessageRoleEnum = pgEnum("chat_message_role", [
  "user",
  "assistant",
  "system",
  "admin", // Для явного выделения сообщений рекрутера/админа
]);

export const chatMessageTypeEnum = pgEnum("chat_message_type", [
  "text",
  "voice",
  "file",
  "event", // Системные события (начало интервью, и т.д.)
]);

export interface ChatMessageMetadata {
  tokensUsed?: number;
  latencyMs?: number;
  model?: string;
  isRead?: boolean;
  [key: string]: unknown;
}

/**
 * Универсальная таблица сообщений
 */
export const chatMessage = pgTable(
  "chat_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => chatSession.id, { onDelete: "cascade" }),

    role: chatMessageRoleEnum("role").notNull(),
    type: chatMessageTypeEnum("type").default("text").notNull(),
    channel: chatChannelEnum("channel").default("web").notNull(), // Канал конкртеного сообщения

    content: text("content"), // Может быть пустым, если это только файл

    // Специфика для голосовых и файлов
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
    voiceDuration: integer("voice_duration"), // в секундах
    voiceTranscription: text("voice_transcription"),
    
    // Внешний ID сообщения (например msg_id из Telegram)
    externalId: varchar("external_id", { length: 100 }),

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
    // Индекс для поиска дубликатов по внешнему ID
    externalIdIdx: index("chat_message_external_id_idx").on(table.externalId),
  }),
);

export type ChatSession = typeof chatSession.$inferSelect;
export type NewChatSession = typeof chatSession.$inferInsert;
export type ChatMessage = typeof chatMessage.$inferSelect;
export type NewChatMessage = typeof chatMessage.$inferInsert;
export type ChatEntityType = (typeof chatEntityTypeEnum.enumValues)[number];
export type ChatMessageRole = (typeof chatMessageRoleEnum.enumValues)[number];
