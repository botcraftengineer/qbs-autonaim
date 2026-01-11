import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
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

export type InterviewSession = typeof interviewSession.$inferSelect;
export type NewInterviewSession = typeof interviewSession.$inferInsert;
export type InterviewEntityType =
  (typeof interviewEntityTypeEnum.enumValues)[number];
export type InterviewStatus = (typeof interviewStatusEnum.enumValues)[number];
export type InterviewChannel = (typeof interviewChannelEnum.enumValues)[number];
