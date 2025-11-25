import {
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { vacancy } from "./vacancy";

export const responseStatusEnum = pgEnum("response_status", [
  "NEW",
  "EVALUATED",
  "DIALOG_APPROVED",
  "INTERVIEW_HH",
  "INTERVIEW_WHATSAPP",
  "COMPLETED",
  "SKIPPED",
]);

export const hrSelectionStatusEnum = pgEnum("hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
]);

export const vacancyResponse = pgTable("vacancy_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  vacancyId: varchar("vacancy_id", { length: 50 })
    .notNull()
    .references(() => vacancy.id, { onDelete: "cascade" }),
  resumeId: varchar("resume_id", { length: 100 }).notNull(),
  resumeUrl: text("resume_url").notNull(),
  candidateName: varchar("candidate_name", { length: 500 }),
  status: responseStatusEnum("status").default("NEW").notNull(),
  hrSelectionStatus: hrSelectionStatusEnum("hr_selection_status"),
  experience: text("experience"),
  contacts: jsonb("contacts"),
  languages: text("languages"),
  about: text("about"),
  education: text("education"),
  courses: text("courses"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
});

export const CreateVacancyResponseSchema = createInsertSchema(vacancyResponse, {
  vacancyId: z.string().max(50),
  resumeId: z.string().max(100),
  resumeUrl: z.string(),
  candidateName: z.string().max(500).optional(),
  status: z
    .enum([
      "NEW",
      "EVALUATED",
      "DIALOG_APPROVED",
      "INTERVIEW_HH",
      "INTERVIEW_WHATSAPP",
      "COMPLETED",
      "SKIPPED",
    ])
    .default("NEW"),
  hrSelectionStatus: z
    .enum(["INVITE", "RECOMMENDED", "NOT_RECOMMENDED", "REJECTED"])
    .optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
