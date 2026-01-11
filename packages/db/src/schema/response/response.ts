import { sql } from "drizzle-orm";
import {
  check,
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
import { candidate } from "../candidate/candidate";
import { file } from "../file";
import {
  hrSelectionStatusEnum,
  hrSelectionStatusValues,
  importSourceEnum,
  importSourceValues,
  recommendationEnum,
  recommendationValues,
  responseStatusEnum,
  responseStatusValues,
} from "../shared/response-enums";

/**
 * Тип сущности для откликов
 */
export const responseEntityTypeEnum = pgEnum("response_entity_type", [
  "gig",
  "vacancy",
  "project",
]);

/**
 * Универсальная таблица откликов
 * Объединяет vacancy_responses и gig_responses в единую полиморфную структуру
 */
export const response = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью (gig, vacancy, project)
    entityType: responseEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Связь с глобальным профилем кандидата (Global Talent Pool)
    globalCandidateId: uuid("global_candidate_id").references(
      () => candidate.id,
      { onDelete: "set null" },
    ),

    // Идентификация кандидата на платформе
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
    telegramPinCode: varchar("telegram_pin_code", { length: 4 }),

    // === Gig-специфичные поля ===
    proposedPrice: integer("proposed_price"),
    proposedDeliveryDays: integer("proposed_delivery_days"),
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // === Vacancy-специфичные поля ===
    resumeId: varchar("resume_id", { length: 100 }),
    resumeUrl: text("resume_url"),
    platformProfileUrl: text("platform_profile_url"),
    salaryExpectationsAmount: integer("salary_expectations_amount"),
    salaryExpectationsComment: varchar("salary_expectations_comment", {
      length: 200,
    }),

    // Сопроводительное письмо
    coverLetter: text("cover_letter"),

    // Файлы
    photoFileId: uuid("photo_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // Опыт и навыки
    experience: text("experience"),
    profileData: jsonb("profile_data").$type<Record<string, unknown>>(),
    skills: jsonb("skills").$type<string[]>(),
    rating: varchar("rating", { length: 20 }),

    // Статусы
    status: responseStatusEnum("status").default("NEW").notNull(),
    hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
    importSource: importSourceEnum("import_source").default("MANUAL").notNull(),

    // Ranking scores (0-100)
    compositeScore: integer("composite_score"),
    priceScore: integer("price_score"),
    deliveryScore: integer("delivery_score"),
    skillsMatchScore: integer("skills_match_score"),
    experienceScore: integer("experience_score"),
    rankingPosition: integer("ranking_position"),

    // Ranking analysis
    rankingAnalysis: text("ranking_analysis"),
    strengths: jsonb("strengths").$type<string[]>(),
    weaknesses: jsonb("weaknesses").$type<string[]>(),
    recommendation: recommendationEnum("recommendation"),
    rankedAt: timestamp("ranked_at", { withTimezone: true, mode: "date" }),

    // Временные метки
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
  (table) => [
    // Уникальность: один кандидат — один отклик на сущность
    unique("response_entity_candidate_unique").on(
      table.entityType,
      table.entityId,
      table.candidateId,
    ),
    // Основные индексы
    index("response_entity_idx").on(table.entityType, table.entityId),
    index("response_global_candidate_idx").on(table.globalCandidateId),
    index("response_status_idx").on(table.status),
    index("response_hr_status_idx").on(table.hrSelectionStatus),
    index("response_import_source_idx").on(table.importSource),
    // Composite индексы для частых запросов
    index("response_entity_status_idx").on(
      table.entityType,
      table.entityId,
      table.status,
    ),
    index("response_entity_hr_status_idx").on(
      table.entityType,
      table.entityId,
      table.hrSelectionStatus,
    ),
    // Ranking индексы
    index("response_composite_score_idx").on(table.compositeScore),
    index("response_recommendation_idx").on(table.recommendation),
    index("response_ranking_position_idx").on(table.rankingPosition),
    // Поиск по кандидату
    index("response_candidate_idx").on(table.candidateId),
    index("response_profile_url_idx").on(table.profileUrl),
    index("response_platform_profile_idx").on(table.platformProfileUrl),
    // GIN индексы для JSONB
    index("response_skills_idx").using("gin", table.skills),
    index("response_profile_data_idx").using("gin", table.profileData),
    index("response_portfolio_links_idx").using("gin", table.portfolioLinks),
    index("response_strengths_idx").using("gin", table.strengths),
    index("response_weaknesses_idx").using("gin", table.weaknesses),
    index("response_contacts_idx").using("gin", table.contacts),
    // CHECK constraints для score полей
    check(
      "response_composite_score_check",
      sql`${table.compositeScore} IS NULL OR ${table.compositeScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_price_score_check",
      sql`${table.priceScore} IS NULL OR ${table.priceScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_delivery_score_check",
      sql`${table.deliveryScore} IS NULL OR ${table.deliveryScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_skills_match_score_check",
      sql`${table.skillsMatchScore} IS NULL OR ${table.skillsMatchScore} BETWEEN 0 AND 100`,
    ),
    check(
      "response_experience_score_check",
      sql`${table.experienceScore} IS NULL OR ${table.experienceScore} BETWEEN 0 AND 100`,
    ),
  ],
);

export const CreateResponseSchema = createInsertSchema(response, {
  entityType: z.enum(["gig", "vacancy", "project"]),
  entityId: z.string().uuid(),
  globalCandidateId: z.string().uuid().optional(),
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  telegramPinCode: z.string().length(4).optional(),
  // Gig fields
  proposedPrice: z.number().int().positive().optional(),
  proposedDeliveryDays: z.number().int().positive().optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  // Vacancy fields
  resumeId: z.string().max(100).optional(),
  resumeUrl: z.string().optional(),
  platformProfileUrl: z.string().optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  salaryExpectationsComment: z.string().max(200).optional(),
  // Common
  coverLetter: z.string().optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  status: z.enum(responseStatusValues).default("NEW"),
  hrSelectionStatus: z.enum(hrSelectionStatusValues).optional(),
  importSource: z.enum(importSourceValues).default("MANUAL"),
  // Scores
  compositeScore: z.number().int().min(0).max(100).optional(),
  priceScore: z.number().int().min(0).max(100).optional(),
  deliveryScore: z.number().int().min(0).max(100).optional(),
  skillsMatchScore: z.number().int().min(0).max(100).optional(),
  experienceScore: z.number().int().min(0).max(100).optional(),
  rankingPosition: z.number().int().positive().optional(),
  rankingAnalysis: z.string().optional(),
  strengths: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  recommendation: z.enum(recommendationValues).optional(),
  rankedAt: z.coerce.date().optional(),
  respondedAt: z.coerce.date().optional(),
  welcomeSentAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateResponseSchema = CreateResponseSchema.partial();

export type Response = typeof response.$inferSelect;
export type NewResponse = typeof response.$inferInsert;
export type ResponseEntityType =
  (typeof responseEntityTypeEnum.enumValues)[number];

// Re-export types from shared for convenience
export type {
  HrSelectionStatus,
  ImportSource,
  Recommendation,
  ResponseStatus,
} from "../shared/response-enums";

// Re-export enum values for backward compatibility
export {
  hrSelectionStatusValues,
  importSourceValues,
  recommendationValues,
  responseStatusValues,
} from "../shared/response-enums";
