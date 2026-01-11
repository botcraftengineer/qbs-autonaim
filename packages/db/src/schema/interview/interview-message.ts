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
import { interviewChannelEnum, interviewSession } from "./interview-session";

/**
 * Роль отправителя сообщения в интервью
 */
export const interviewMessageRoleEnum = pgEnum("interview_message_role", [
  "user", // Кандидат/фрилансер
  "assistant", // AI-бот
  "system", // Системные сообщения
]);

/**
 * Тип сообщения
 */
export const interviewMessageTypeEnum = pgEnum("interview_message_type", [
  "text",
  "voice",
  "file",
  "event", // Системные события (начало, пауза, завершение)
]);

/**
 * Метаданные сообщения интервью
 */
export interface InterviewMessageMetadata {
  /** Использовано токенов */
  tokensUsed?: number;
  /** Задержка ответа в мс */
  latencyMs?: number;
  /** Модель AI */
  model?: string;
  /** Прочитано ли */
  isRead?: boolean;
  /** Номер вопроса (для сообщений бота) */
  questionNumber?: number;
  /** Дополнительные данные */
  [key: string]: unknown;
}

/**
 * Сообщение в интервью
 */
export const interviewMessage = pgTable(
  "interview_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => interviewSession.id, { onDelete: "cascade" }),

    // Отправитель и тип
    role: interviewMessageRoleEnum("role").notNull(),
    type: interviewMessageTypeEnum("type").default("text").notNull(),

    // Канал конкретного сообщения (омниканальность)
    channel: interviewChannelEnum("channel").default("web").notNull(),

    // Контент
    content: text("content"), // Может быть пустым для файлов/голосовых

    // Голосовые сообщения
    fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
    voiceDuration: integer("voice_duration"), // в секундах
    voiceTranscription: text("voice_transcription"),

    // Внешний ID (msg_id из Telegram и т.д.)
    externalId: varchar("external_id", { length: 100 }),

    // Quick replies для бота
    quickReplies: jsonb("quick_replies").$type<string[]>(),

    // Метаданные
    metadata: jsonb("metadata").$type<InterviewMessageMetadata>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("interview_message_session_idx").on(table.sessionId),
    sessionCreatedIdx: index("interview_message_session_created_idx").on(
      table.sessionId,
      table.createdAt,
    ),
    externalIdIdx: index("interview_message_external_id_idx").on(
      table.externalId,
    ),
    channelIdx: index("interview_message_channel_idx").on(table.channel),
    metadataIdx: index("interview_message_metadata_idx").using(
      "gin",
      table.metadata,
    ),
    quickRepliesIdx: index("interview_message_quick_replies_idx").using(
      "gin",
      table.quickReplies,
    ),
  }),
);

export type InterviewMessage = typeof interviewMessage.$inferSelect;
export type NewInterviewMessage = typeof interviewMessage.$inferInsert;
export type InterviewMessageRole =
  (typeof interviewMessageRoleEnum.enumValues)[number];
