import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file";
import {
  candidateContactColumns,
  candidateExperienceColumns,
  candidateFileColumns,
  candidateIdentityColumns,
  coverLetterColumn,
  rankingAnalysisColumns,
  rankingScoreColumns,
  responseStatusColumns,
  responseTimestampColumns,
} from "../shared/response-columns";
import {
  hrSelectionStatusValues,
  importSourceValues,
  recommendationValues,
  responseStatusValues,
} from "../shared/response-enums";

import { gig } from "./gig";

/**
 * Таблица откликов на разовые задания (gigs)
 */
export const gigResponse = pgTable(
  "gig_responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gig.id, { onDelete: "cascade" }),

    // Идентификация кандидата (уникальный ID на платформе)
    candidateId: varchar("candidate_id", { length: 100 }).notNull(),
    ...candidateIdentityColumns,

    // Контакты
    ...candidateContactColumns,

    // Предложение кандидата (специфично для gig)
    proposedPrice: integer("proposed_price"),
    proposedCurrency: varchar("proposed_currency", { length: 3 }).default(
      "RUB",
    ),
    proposedDeliveryDays: integer("proposed_delivery_days"),

    // Сопроводительное письмо
    ...coverLetterColumn,

    // Портфолио (специфично для gig)
    portfolioLinks: jsonb("portfolio_links").$type<string[]>(),
    portfolioFileId: uuid("portfolio_file_id").references(() => file.id, {
      onDelete: "set null",
    }),

    // Файлы
    ...candidateFileColumns,

    // Опыт и навыки
    ...candidateExperienceColumns,

    // Статусы
    ...responseStatusColumns,

    // Ranking scores
    ...rankingScoreColumns,

    // Ranking analysis
    ...rankingAnalysisColumns,

    // Временные метки
    ...responseTimestampColumns,
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
    compositeScoreIdx: index("gig_response_composite_score_idx").on(
      table.compositeScore,
    ),
    recommendationIdx: index("gig_response_recommendation_idx").on(
      table.recommendation,
    ),
    rankingPositionIdx: index("gig_response_ranking_position_idx").on(
      table.rankingPosition,
    ),
  }),
);

export const CreateGigResponseSchema = createInsertSchema(gigResponse, {
  candidateId: z.string().max(100),
  candidateName: z.string().max(500).optional(),
  profileUrl: z.string().url().optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  proposedPrice: z.number().int().positive().optional(),
  proposedCurrency: z.string().length(3).default("RUB"),
  proposedDeliveryDays: z.number().int().positive().optional(),
  coverLetter: z.string().optional(),
  portfolioLinks: z.string().url().array().optional(),
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

export type GigResponse = typeof gigResponse.$inferSelect;
export type NewGigResponse = typeof gigResponse.$inferInsert;

// Re-export enum values for backward compatibility
export {
  hrSelectionStatusValues as gigHrSelectionStatusValues,
  importSourceValues as gigImportSourceValues,
  recommendationValues as gigRecommendationValues,
  responseStatusValues as gigResponseStatusValues,
} from "../shared/response-enums";
