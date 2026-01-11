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
import { gigResponse } from "../gig/response";
import { vacancyResponse } from "../vacancy/response";

/**
 * Тип сущности для интервью
 */
export const interviewEntityTypeEnum = pgEnum("interview_entity_type", [
  "vacancy_response", // Интервью кандидата на вакансию
  "gig_response", // Интервью фрилансера на гиг
]);

/**
 * Статус интервью
 */
export const interviewStatusEnum = pgEnum("interview_status", [
  "pending", // Ожидает начала
  "active", // В процессе
  "completed", // Завершено
  "cancelled", // Отменено
  "paused", // Приостановлено (кандидат попросил перенести)
]);

/**
 * Канал коммуникации
 */
export const interviewChannelEnum = pgEnum("interview_channel", [
  "web",
  "telegram",
  "whatsapp",
  "max", // Будущий мессенджер
]);

/**
 * Метаданные интервью-сессии
 */
export interface InterviewSessionMetadata {
  /** Ответы на вопросы интервью */
  questionAnswers?: Array<{
    question: string;
    answer: string;
    timestamp?: string;
  }>;
  /** Telegram username кандидата */
  telegramUsername?: string;
  /** Telegram chat ID */
  telegramChatId?: string;
  /** Причина паузы/отмены */
  pauseReason?: string;
  /** Дополнительные данные */
  [key: string]: unknown;
}

/**
 * Сессия интервью с AI-ботом
 * Отдельная таблица для интервью кандидатов/фрилансеров
 */
export const interviewSession = pgTable(
  "interview_sessions",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с откликом
    entityType: interviewEntityTypeEnum("entity_type").notNull(),

    // FK на vacancy_response или gig_response (одно из двух)
    vacancyResponseId: uuid("vacancy_response_id").references(
      () => vacancyResponse.id,
      { onDelete: "cascade" },
    ),
    gigResponseId: uuid("gig_response_id").references(() => gigResponse.id, {
      onDelete: "cascade",
    }),

    // Статус и канал
    status: interviewStatusEnum("status").default("pending").notNull(),
    lastChannel: interviewChannelEnum("last_channel"), // Последний активный канал

    // Прогресс интервью
    questionNumber: integer("question_number").default(0).notNull(),
    totalQuestions: integer("total_questions"), // Планируемое кол-во вопросов

    // Счётчики
    messageCount: integer("message_count").default(0).notNull(),
    lastMessageAt: timestamp("last_message_at", {
      withTimezone: true,
      mode: "date",
    }),

    // Метаданные
    metadata: jsonb("metadata").$type<InterviewSessionMetadata>(),

    // Timestamps
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    vacancyResponseIdx: index("interview_session_vacancy_response_idx").on(
      table.vacancyResponseId,
    ),
    gigResponseIdx: index("interview_session_gig_response_idx").on(
      table.gigResponseId,
    ),
    statusIdx: index("interview_session_status_idx").on(table.status),
    entityTypeIdx: index("interview_session_entity_type_idx").on(
      table.entityType,
    ),
    metadataIdx: index("interview_session_metadata_idx").using(
      "gin",
      table.metadata,
    ),
    lastMessageAtIdx: index("interview_session_last_message_at_idx").on(
      table.lastMessageAt,
    ),
  }),
);

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

// Type exports
export type InterviewSession = typeof interviewSession.$inferSelect;
export type NewInterviewSession = typeof interviewSession.$inferInsert;
export type InterviewMessage = typeof interviewMessage.$inferSelect;
export type NewInterviewMessage = typeof interviewMessage.$inferInsert;
export type InterviewEntityType =
  (typeof interviewEntityTypeEnum.enumValues)[number];
export type InterviewStatus = (typeof interviewStatusEnum.enumValues)[number];
export type InterviewChannel = (typeof interviewChannelEnum.enumValues)[number];
export type InterviewMessageRole =
  (typeof interviewMessageRoleEnum.enumValues)[number];
