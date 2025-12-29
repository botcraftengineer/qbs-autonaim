import { sql } from "drizzle-orm";
import {
  index,
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
import { vacancy } from "./vacancy";

export const responseStatusEnum = pgEnum("response_status", [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "COMPLETED",
  "SKIPPED",
]);

export const hrSelectionStatusEnum = pgEnum("hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "ONBOARDING",
]);

export const importSourceEnum = pgEnum("import_source", [
  "HH_API",
  "FREELANCE_MANUAL",
  "FREELANCE_LINK",
]);

export const vacancyResponse = pgTable(
  "vacancy_responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),
    resumeId: varchar("resume_id", { length: 100 }).notNull(),
    resumeUrl: text("resume_url").notNull(),
    candidateName: varchar("candidate_name", { length: 500 }),
    telegramUsername: varchar("telegram_username", { length: 100 }),
    chatId: varchar("chat_id", { length: 100 }),
    coverLetter: text("cover_letter"),
    status: responseStatusEnum("status").default("NEW").notNull(),
    hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
    importSource: importSourceEnum("import_source").default("HH_API"),
    platformProfileUrl: text("platform_profile_url"),
    experience: text("experience"),
    contacts: jsonb("contacts").$type<Record<string, unknown>>(),
    phone: varchar("phone", { length: 50 }),
    resumeLanguage: varchar("resume_language", { length: 10 }).default("ru"),
    telegramPinCode: varchar("telegram_pin_code", { length: 4 }),
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    photoFileId: uuid("photo_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    salaryExpectations: varchar("salary_expectations", { length: 200 }),
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
    // Composite unique constraint: one resume can apply to multiple vacancies
    // but can only apply once per vacancy
    vacancyResumeUnique: unique().on(table.vacancyId, table.resumeId),
    vacancyIdx: index("response_vacancy_idx").on(table.vacancyId),
    statusIdx: index("response_status_idx").on(table.status),
    hrStatusIdx: index("response_hr_status_idx").on(table.hrSelectionStatus),
    importSourceIdx: index("response_import_source_idx").on(table.importSource),
    platformProfileIdx: index("response_platform_profile_idx").on(
      table.platformProfileUrl,
    ),
    // Composite index для фильтрации по вакансии и статусу
    vacancyStatusIdx: index("response_vacancy_status_idx").on(
      table.vacancyId,
      table.status,
    ),
    // Composite index для проверки дубликатов по platformProfileUrl + vacancyId
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
  salaryExpectations: z.string().max(200).optional(),
  resumeLanguage: z.string().max(10).default("ru").optional(),
  status: z
    .enum(["NEW", "EVALUATED", "INTERVIEW", "COMPLETED", "SKIPPED"])
    .default("NEW"),
  hrSelectionStatus: z
    .enum([
      "INVITE",
      "RECOMMENDED",
      "NOT_RECOMMENDED",
      "REJECTED",
      "OFFER",
      "SECURITY_PASSED",
      "CONTRACT_SENT",
      "ONBOARDING",
    ])
    .optional(),
  importSource: z
    .enum(["HH_API", "FREELANCE_MANUAL", "FREELANCE_LINK"])
    .default("HH_API")
    .optional(),
  platformProfileUrl: z.string().optional(),
  respondedAt: z.date().optional(),
  welcomeSentAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyResponse = typeof vacancyResponse.$inferSelect;
