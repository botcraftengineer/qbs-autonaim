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
 */
export const response = pgTable(
  "responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь
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

    // Предложение (для gig)
    proposedPrice: integer("proposed_price"),

    proposedDeliveryDays: integer("proposed_delivery_days"),

    // Ожидания (для vacancy)
    salaryExpectations: varchar("salary_expectations", { length: 200 }),
    resumeId: varchar("resume_id", { length: 100 }),
    resumeUrl: text("resume_url"),
    platformProfileUrl: text("platform_profile_url"),

    // Сопроводительное письмо
    coverLetter: text("cover_letter"),

    // Портфолио
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

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
    resumeLanguage: varchar("resume_language", { length: 10 }).default("ru"),

    // Статусы
    status: responseStatusEnum("status").default("NEW").notNull(),
    hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
    importSource: importSourceEnum("import_source").default("MANUAL").notNull(),

    // Telegram
    telegramPinCode: varchar("telegram_pin_code", { length: 4 }),

    // Ranking scores
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
    rankedAt: timestamp("ranked_at", { withTimezone: true }),

    // Временные метки
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
  (table) => [
    unique("response_entity_candidate_unique").on(
      table.entityType,
      table.entityId,
      table.candidateId,
    ),
    index("response_entity_idx").on(table.entityType, table.entityId),
    index("response_status_idx").on(table.status),
    index("response_hr_status_idx").on(table.hrSelectionStatus),
    index("response_import_source_idx").on(table.importSource),
    index("response_entity_status_idx").on(
      table.entityType,
      table.entityId,
      table.status,
    ),
    index("response_composite_score_idx").on(table.compositeScore),
    index("response_recommendation_idx").on(table.recommendation),
    index("response_ranking_position_idx").on(table.rankingPosition),
    index("response_candidate_idx").on(table.candidateId),
    index("response_skills_idx").using("gin", table.skills),
    index("response_profile_data_idx").using("gin", table.profileData),
    index("response_portfolio_links_idx").using("gin", table.portfolioLinks),
    index("response_strengths_idx").using("gin", table.strengths),
    index("response_weaknesses_idx").using("gin", table.weaknesses),
    index("response_contacts_idx").using("gin", table.contacts),
  ],
);

export const CreateResponseSchema = createInsertSchema(response, {
  entityType: z.enum(["gig", "vacancy", "project"]),
  entityId: z.string().uuid(),
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  proposedPrice: z.number().int().positive().optional(),

  proposedDeliveryDays: z.number().int().positive().optional(),
  salaryExpectations: z.string().max(200).optional(),
  resumeId: z.string().max(100).optional(),
  resumeUrl: z.string().optional(),
  platformProfileUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  portfolioLinks: z.array(z.string().url()).optional(),
  experience: z.string().optional(),
  skills: z.array(z.string()).optional(),
  rating: z.string().max(20).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  status: z.enum(responseStatusValues).default("NEW"),
  hrSelectionStatus: z.enum(hrSelectionStatusValues).optional(),
  importSource: z.enum(importSourceValues).default("MANUAL"),
  telegramPinCode: z.string().length(4).optional(),
  respondedAt: z.coerce.date().optional(),
  welcomeSentAt: z.coerce.date().optional(),
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
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

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
