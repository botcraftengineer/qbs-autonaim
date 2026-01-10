import { sql } from "drizzle-orm";
import {
  boolean,
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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file";
import { response } from "./response";

/**
 * Источник/канал разговора
 */
export const conversationSourceEnum = pgEnum("conversation_source", [
  "WEB",
  "TELEGRAM",
  "WHATSAPP",
]);

/**
 * Статус разговора
 */
export const conversationStatusEnum = pgEnum("conversation_status", [
  "ACTIVE",
  "COMPLETED",
  "ARCHIVED",
  "PAUSED",
]);

/**
 * Универсальная таблица разговоров (интервью)
 */
export const conversation = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Связь с откликом
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),

    // Для gig откликов (backward compatibility)
    gigResponseId: uuid("gig_response_id"),

    // Источник/канал
    source: conversationSourceEnum("source").default("WEB").notNull(),

    // Статус
    status: conversationStatusEnum("status").default("ACTIVE").notNull(),

    // Telegram данные
    username: varchar("username", { length: 100 }),
    chatId: varchar("chat_id", { length: 100 }),

    // Счётчики
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),

    // Прогресс интервью
    questionNumber: integer("question_number").default(0).notNull(),
    totalQuestions: integer("total_questions"),

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
  (table) => [
    index("conversation_response_idx").on(table.responseId),
    index("conversation_gig_response_idx").on(table.gigResponseId),
    index("conversation_status_idx").on(table.status),
    index("conversation_source_idx").on(table.source),
    index("conversation_username_idx").on(table.username),
    index("conversation_chat_id_idx").on(table.chatId),
  ],
);

/**
 * Отправитель сообщения
 */
export const messageSenderEnum = pgEnum("message_sender", [
  "USER",
  "BOT",
  "SYSTEM",
]);

/**
 * Тип контента сообщения
 */
export const messageContentTypeEnum = pgEnum("message_content_type", [
  "TEXT",
  "VOICE",
  "FILE",
  "IMAGE",
]);

/**
 * Сообщения в разговорах
 */
export const conversationMessage = pgTable(
  "conversation_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, { onDelete: "cascade" }),

    // Отправитель
    sender: messageSenderEnum("sender").notNull(),
    // Для совместимости с interviewMessage
    role: varchar("role", { length: 20 }).$type<
      "user" | "assistant" | "system"
    >(),

    // Тип контента
    contentType: messageContentTypeEnum("content_type")
      .default("TEXT")
      .notNull(),

    // Контент
    content: text("content"),

    // Файл (для голосовых и файлов)
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
    voiceDuration: integer("voice_duration"),
    voiceTranscription: text("voice_transcription"),

    // Внешний ID (msg_id из Telegram)
    externalId: varchar("external_id", { length: 100 }),

    // Quick replies
    quickReplies: jsonb("quick_replies").$type<string[]>(),

    // Флаги
    isRead: boolean("is_read").default(false).notNull(),

    // Метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("conversation_message_conversation_idx").on(table.conversationId),
    index("conversation_message_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("conversation_message_sender_idx").on(table.sender),
    index("conversation_message_external_id_idx").on(table.externalId),
  ],
);

export const CreateConversationSchema = createInsertSchema(conversation, {
  responseId: z.string().uuid(),
  gigResponseId: z.string().uuid().optional(),
  source: z.enum(["WEB", "TELEGRAM", "WHATSAPP"]).default("WEB"),
  status: z
    .enum(["ACTIVE", "COMPLETED", "ARCHIVED", "PAUSED"])
    .default("ACTIVE"),
  username: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  questionNumber: z.number().int().min(0).default(0),
  totalQuestions: z.number().int().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  messageCount: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateConversationMessageSchema = createInsertSchema(
  conversationMessage,
  {
    conversationId: z.string().uuid(),
    sender: z.enum(["USER", "BOT", "SYSTEM"]),
    role: z.enum(["user", "assistant", "system"]).optional(),
    contentType: z.enum(["TEXT", "VOICE", "FILE", "IMAGE"]).default("TEXT"),
    content: z.string().optional(),
    fileId: z.string().uuid().optional(),
    voiceDuration: z.number().int().positive().optional(),
    voiceTranscription: z.string().optional(),
    externalId: z.string().max(100).optional(),
    quickReplies: z.array(z.string()).optional(),
    isRead: z.boolean().default(false),
    metadata: z.record(z.string(), z.unknown()).optional(),
  },
).omit({
  id: true,
  createdAt: true,
});

export type Conversation = typeof conversation.$inferSelect;
export type NewConversation = typeof conversation.$inferInsert;
export type ConversationMessage = typeof conversationMessage.$inferSelect;
export type NewConversationMessage = typeof conversationMessage.$inferInsert;
export type ConversationSource =
  (typeof conversationSourceEnum.enumValues)[number];
export type ConversationStatus =
  (typeof conversationStatusEnum.enumValues)[number];
export type MessageSender = (typeof messageSenderEnum.enumValues)[number];
export type MessageContentType =
  (typeof messageContentTypeEnum.enumValues)[number];

// Backward compatibility - CreateMessageSchema alias
export const CreateMessageSchema = CreateConversationMessageSchema;
