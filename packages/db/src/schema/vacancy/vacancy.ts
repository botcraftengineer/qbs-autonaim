import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { workspace } from "../workspace/workspace";

export const vacancy = pgTable(
  "vacancies",
  {
    id: varchar("id", { length: 50 }).primaryKey(),

    // Workspace к которому принадлежит вакансия
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    url: text("url"),
    views: integer("views").default(0),
    responses: integer("responses").default(0),
    newResponses: integer("new_responses").default(0),
    resumesInProgress: integer("resumes_in_progress").default(0),
    suitableResumes: integer("suitable_resumes").default(0),
    region: varchar("region", { length: 200 }),
    description: text("description"),
    requirements: jsonb("requirements"),

    // Кастомные настройки для бота
    customBotInstructions: text("custom_bot_instructions"),
    customScreeningPrompt: text("custom_screening_prompt"),
    customInterviewQuestions: text("custom_interview_questions"),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("vacancy_workspace_idx").on(table.workspaceId),
  }),
);

export const CreateVacancySchema = createInsertSchema(vacancy, {
  id: z.string().max(50),
  title: z.string().max(500),
  url: z.string().optional(),
  customBotInstructions: z.string().max(5000).optional(),
  customScreeningPrompt: z.string().max(5000).optional(),
  customInterviewQuestions: z.string().max(5000).optional(),
}).omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateVacancySettingsSchema = z.object({
  customBotInstructions: z.string().max(5000).optional().nullable(),
  customScreeningPrompt: z.string().max(5000).optional().nullable(),
  customInterviewQuestions: z.string().max(5000).optional().nullable(),
});
