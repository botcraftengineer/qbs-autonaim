import { sql } from "drizzle-orm";
import {
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
  "DIALOG_APPROVED",
  "INTERVIEW_HH",
  "COMPLETED",
  "SKIPPED",
]);

export const hrSelectionStatusEnum = pgEnum("hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
]);

export const vacancyResponse = pgTable(
  "vacancy_responses",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: varchar("vacancy_id", { length: 50 })
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
    experience: text("experience"),
    contacts: jsonb("contacts"),
    phone: varchar("phone", { length: 50 }),
    telegramInviteToken: varchar("telegram_invite_token", {
      length: 100,
    }).unique(),
    resumePdfFileId: uuid("resume_pdf_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    respondedAt: timestamp("responded_at"),
    welcomeSentAt: timestamp("welcome_sent_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Composite unique constraint: one resume can apply to multiple vacancies
    // but can only apply once per vacancy
    vacancyResumeUnique: unique().on(table.vacancyId, table.resumeId),
  }),
);

export const CreateVacancyResponseSchema = createInsertSchema(vacancyResponse, {
  vacancyId: z.string().max(50),
  resumeId: z.string().max(100),
  resumeUrl: z.string(),
  candidateName: z.string().max(500).optional(),
  telegramUsername: z.string().max(100).optional(),
  chatId: z.string().max(100).optional(),
  coverLetter: z.string().optional(),
  telegramInviteToken: z.string().max(100).optional(),
  status: z
    .enum([
      "NEW",
      "EVALUATED",
      "DIALOG_APPROVED",
      "INTERVIEW_HH",
      "COMPLETED",
      "SKIPPED",
    ])
    .default("NEW"),
  hrSelectionStatus: z
    .enum(["INVITE", "RECOMMENDED", "NOT_RECOMMENDED", "REJECTED"])
    .optional(),
  respondedAt: z.date().optional(),
  welcomeSentAt: z.date().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyResponse = typeof vacancyResponse.$inferSelect;
