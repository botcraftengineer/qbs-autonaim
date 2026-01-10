import { sql } from "drizzle-orm";
import {
  index,
  integer,
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
  responseStatusColumns,
  responseTimestampColumns,
} from "../shared/response-columns";
import {
  hrSelectionStatusValues,
  importSourceValues,
  responseStatusValues,
} from "../shared/response-enums";
import { candidate } from "../candidate/candidate";
import { vacancy } from "./vacancy";

/**
 * Таблица откликов на вакансии
 */
export const vacancyResponse = pgTable(
  "vacancy_responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),

    // ID кандидата в глобальной базе (Global Talent Pool)
    globalCandidateId: uuid("global_candidate_id").references(
      () => candidate.id,
      { onDelete: "set null" },
    ),

    // Идентификация кандидата (resumeId с hh.ru или другой платформы)
    resumeId: varchar("resume_id", { length: 100 }).notNull(),
    resumeUrl: text("resume_url").notNull(),
    ...candidateIdentityColumns,

    // Контакты
    ...candidateContactColumns,

    // Сопроводительное письмо
    ...coverLetterColumn,

    // Файлы (специфично для vacancy)
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    ...candidateFileColumns,

    // Опыт и навыки
    ...candidateExperienceColumns,

    // Ожидания по зарплате (специфично для vacancy)
    // Ожидания по зарплате (специфично для vacancy)
    salaryExpectationsAmount: integer("salary_expectations_amount"),
    salaryExpectationsComment: varchar("salary_expectations_comment", {
      length: 200,
    }),

    // URL профиля на платформе (для фрилансеров)
    platformProfileUrl: text("platform_profile_url"),

    // Статусы
    ...responseStatusColumns,

    // Временные метки
    ...responseTimestampColumns,
  },
  (table) => ({
    vacancyResumeUnique: unique().on(table.vacancyId, table.resumeId),
    vacancyIdx: index("response_vacancy_idx").on(table.vacancyId),
    statusIdx: index("response_status_idx").on(table.status),
    hrStatusIdx: index("response_hr_status_idx").on(table.hrSelectionStatus),
    importSourceIdx: index("response_import_source_idx").on(table.importSource),
    platformProfileIdx: index("response_platform_profile_idx").on(
      table.platformProfileUrl,
    ),
    vacancyStatusIdx: index("response_vacancy_status_idx").on(
      table.vacancyId,
      table.status,
    ),
    vacancyPlatformProfileIdx: index("response_vacancy_platform_idx").on(
      table.vacancyId,
      table.platformProfileUrl,
    ),
  }),
);

export const CreateVacancyResponseSchema = createInsertSchema(vacancyResponse, {
  resumeId: z.string().max(100),
  resumeUrl: z.string(),
  candidateName: z.string().max(500).optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  coverLetter: z.string().optional(),
  telegramPinCode: z.string().length(4).optional(),
  salaryExpectationsAmount: z.number().int().optional(),
  salaryExpectationsComment: z.string().max(200).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  status: z.enum(responseStatusValues).default("NEW"),
  hrSelectionStatus: z.enum(hrSelectionStatusValues).optional(),
  importSource: z.enum(importSourceValues).default("HH_API"),
  platformProfileUrl: z.string().optional(),
  respondedAt: z.coerce.date().optional(),
  welcomeSentAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyResponse = typeof vacancyResponse.$inferSelect;
export type NewVacancyResponse = typeof vacancyResponse.$inferInsert;
