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
import { file } from "../file";
import type { StoredProfileData } from "../types";

/**
 * Тип сущности для откликов (полиморфная связь)
 */
export const responseEntityTypeEnum = pgEnum("response_entity_type", [
  "gig",
  "vacancy",
  "project",
]);

/**
 * Универсальный статус отклика
 */
export const responseStatusEnum = pgEnum("universal_response_status", [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
]);

/**
 * Универсальный HR статус отбора
 */
export const hrSelectionStatusEnum = pgEnum("universal_hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "ONBOARDING",
  "DONE",
]);

/**
 * Источник импорта отклика
 */
export const importSourceEnum = pgEnum("universal_import_source", [
  "MANUAL",
  "KWORK",
  "FL_RU",
  "WEBLANCER",
  "UPWORK",
  "FREELANCE_RU",
  "HH_API",
  "WEB_LINK",
]);

/**
 * Рекомендация по кандидату
 */
export const recommendationEnum = pgEnum("universal_recommendation", [
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
]);

/**
 * Универсальная таблица откликов
 * Работает для gig, vacancy, project и других типов через полиморфную связь
 */
export const response = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью
    entityType: responseEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

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

    // Предложение кандидата (для gig)
    proposedPrice: integer("proposed_price"),
    proposedCurrency: varchar("proposed_currency", { length: 3 }).default(
      "RUB",
    ),
    proposedDeliveryDays: integer("proposed_delivery_days"),

    // Ожидания по зарплате (для vacancy)
    salaryExpectations: varchar("salary_expectations", { length: 200 }),

    // Сопроводительное письмо
    coverLetter: text("cover_letter"),

    // Портфолио и файлы
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    photoFileId: uuid("photo_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // Опыт и навыки
    experience: text("experience"),
    profileData: jsonb("profile_data").$type<StoredProfileData>(),
    skills: jsonb("skills").$type<string[]>(),
    rating: varchar("rating", { length: 20 }),

    // Статусы
    status: responseStatusEnum("status").default("NEW").notNull(),
    hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
    importSource: importSourceEnum("import_source").default("MANUAL"),

    // PIN для Telegram авторизации
    telegramPinCode: varchar("telegram_pin_code", { length: 4 }),

    // Ranking scores (0-100)
    compositeScore: integer("composite_score"),
    priceScore: integer("price_score"),
    deliveryScore: integer("delivery_score"),
    skillsMatchScore: integer("skills_match_score"),
    experienceScore: integer("experience_score"),

    // Ranking position and analysis
    rankingPosition: integer("ranking_position"),
    rankingAnalysis: text("ranking_analysis"),
    strengths: jsonb("strengths").$type<string[]>(),
    weaknesses: jsonb("weaknesses").$type<string[]>(),
    recommendation: recommendationEnum("recommendation"),
    rankedAt: timestamp("ranked_at", { withTimezone: true }),

    // Даты
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    welcomeSentAt: timestamp("welcome_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Уникальность: один кандидат может откликнуться на одну сущность только раз
    entityCandidateUnique: unique("response_entity_candidate_unique").on(
      table.entityType,
      table.entityId,
      table.candidateId,
    ),

    // Индексы для быстрого поиска
    entityTypeIdx: index("response_entity_type_idx").on(table.entityType),
    entityIdx: index("response_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    statusIdx: index("response_status_idx").on(table.status),
    hrStatusIdx: index("response_hr_status_idx").on(table.hrSelectionStatus),
    importSourceIdx: index("response_import_source_idx").on(table.importSource),
    entityStatusIdx: index("response_entity_status_idx").on(
      table.entityType,
      table.entityId,
      table.status,
    ),
    profileUrlIdx: index("response_profile_url_idx").on(table.profileUrl),
    compositeScoreIdx: index("response_composite_score_idx").on(
      table.compositeScore,
    ),
    recommendationIdx: index("response_recommendation_idx").on(
      table.recommendation,
    ),
    rankingPositionIdx: index("response_ranking_position_idx").on(
      table.rankingPosition,
    ),
  }),
);

export type Response = typeof response.$inferSelect;
export type NewResponse = typeof response.$inferInsert;
export type ResponseEntityType =
  (typeof responseEntityTypeEnum.enumValues)[number];
export type ResponseStatus = (typeof responseStatusEnum.enumValues)[number];
export type HrSelectionStatus =
  (typeof hrSelectionStatusEnum.enumValues)[number];
export type ImportSource = (typeof importSourceEnum.enumValues)[number];
export type Recommendation = (typeof recommendationEnum.enumValues)[number];
