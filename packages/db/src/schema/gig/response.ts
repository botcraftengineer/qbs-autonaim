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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { file } from "../file";
import { gig } from "./gig";

/**
 * Статус отклика на gig
 */
export const gigResponseStatusEnum = pgEnum("gig_response_status", [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
]);

/**
 * HR статус отбора для gig
 */
export const gigHrSelectionStatusEnum = pgEnum("gig_hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "DONE",
]);

/**
 * Источник импорта отклика
 */
export const gigImportSourceEnum = pgEnum("gig_import_source", [
  "MANUAL",
  "KWORK",
  "FL_RU",
  "WEBLANCER",
  "UPWORK",
  "FREELANCE_RU",
  "WEB_LINK",
]);

/**
 * Таблица откликов на разовые задания
 */
export const gigResponse = pgTable(
  "gig_responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),

    // Идентификация кандидата
    candidateId: varchar("candidate_id", { length: 100 }).notNull(),
    candidateName: varchar("candidate_name", { length: 500 }),
    profileUrl: text("profile_url"),

    // Контакты
    telegramUsername: varchar("telegram_username", { length: 100 }),
    chatId: varchar("chat_id", { length: 100 }),
    phone: varchar("phone", { length: 50 }),
    email: varchar("email", { length: 255 }),
    contacts: jsonb("contacts").$type<Record<string, unknown>>(),
    resumeLanguage: varchar("resume_language", { length: 10 }).default("ru"),

    // Предложение кандидата
    proposedPrice: integer("proposed_price"),
    proposedCurrency: varchar("proposed_currency", { length: 3 }).default(
      "RUB",
    ),
    proposedDeliveryDays: integer("proposed_delivery_days"),
    coverLetter: text("cover_letter"),

    // Портфолио
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    photoFileId: uuid("photo_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // Опыт и навыки
    experience: text("experience"),
    skills: jsonb("skills").$type<string[]>(),
    rating: varchar("rating", { length: 20 }), // Рейтинг на платформе

    // Статусы
    status: gigResponseStatusEnum("status").default("NEW").notNull(),
    hrSelectionStatus: gigHrSelectionStatusEnum("hr_selection_status"),
    importSource: gigImportSourceEnum("import_source").default("MANUAL"),

    // PIN для Telegram авторизации
    telegramPinCode: varchar("telegram_pin_code", { length: 4 }),

    // Даты
    respondedAt: timestamp("responded_at", {
      withTimezone: true,
      mode: "date",
    }),
    welcomeSentAt: timestamp("welcome_sent_at", {
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
    gigCandidateUnique: unique().on(table.gigId, table.candidateId),
    gigIdx: index("gig_response_gig_idx").on(table.gigId),
    statusIdx: index("gig_response_status_idx").on(table.status),
    hrStatusIdx: index("gig_response_hr_status_idx").on(
      table.hrSelectionStatus,
    ),
    importSourceIdx: index("gig_response_import_source_idx").on(
      table.importSource,
    ),
    gigStatusIdx: index("gig_response_gig_status_idx").on(
      table.gigId,
      table.status,
    ),
    profileUrlIdx: index("gig_response_profile_url_idx").on(table.profileUrl),
  }),
);

export const gigResponseStatusValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
] as const;

export const gigHrSelectionStatusValues = [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "DONE",
] as const;

export const gigImportSourceValues = [
  "MANUAL",
  "KWORK",
  "FL_RU",
  "WEBLANCER",
  "UPWORK",
  "FREELANCE_RU",
  "WEB_LINK",
] as const;

export const CreateGigResponseSchema = createInsertSchema(gigResponse, {
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.email().max(255).optional(),
  proposedPrice: z.number().int().positive().optional(),
  proposedCurrency: z.string().length(3).default("RUB"),
  proposedDeliveryDays: z.number().int().positive().optional(),
  coverLetter: z.string().optional(),
  portfolioLinks: z.string().url().array().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  status: z.enum(gigResponseStatusValues).default("NEW"),
  hrSelectionStatus: z.enum(gigHrSelectionStatusValues).optional(),
  importSource: z.enum(gigImportSourceValues).default("MANUAL"),
  telegramPinCode: z.string().length(4).optional(),
  respondedAt: z.coerce.date().optional(),
  welcomeSentAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type GigResponse = typeof gigResponse.$inferSelect;
export type NewGigResponse = typeof gigResponse.$inferInsert;
