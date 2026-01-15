import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { customDomain } from "../custom-domain/custom-domain";
import {
  platformSourceEnum,
  platformSourceValues,
} from "../shared/response-enums";
import { workspace } from "../workspace/workspace";

/**
 * Таблица сценариев интервью
 */
export const interviewScenario = pgTable(
  "interview_scenarios",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит сценарий
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    name: varchar("name", { length: 200 }).notNull(),
    description: text("description"),

    // Настройки сценария
    customBotInstructions: text("custom_bot_instructions"),
    customScreeningPrompt: text("custom_screening_prompt"),
    customInterviewQuestions: text("custom_interview_questions"),
    customOrganizationalQuestions: text("custom_organizational_questions"),

    // Метаданные
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("interview_scenario_workspace_idx").on(
      table.workspaceId,
    ),
    activeIdx: index("interview_scenario_active_idx")
      .on(table.workspaceId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

/**
 * Тип разового задания
 */
export const gigTypeEnum = pgEnum("gig_type", [
  "DEVELOPMENT",
  "DESIGN",
  "COPYWRITING",
  "MARKETING",
  "TRANSLATION",
  "VIDEO",
  "AUDIO",
  "DATA_ENTRY",
  "RESEARCH",
  "CONSULTING",
  "OTHER",
]);

/**
 * Требования к разовому заданию (структурированные)
 */
export interface GigRequirements {
  title: string;
  summary: string;
  deliverables: string[];
  required_skills: string[];
  nice_to_have_skills: string[];
  tech_stack: string[];
  experience_level: string;
  languages: Array<{
    language: string;
    level: string;
  }>;
  keywords_for_matching: string[];
}

/**
 * Таблица разовых заданий (gigs)
 */
export const gig = pgTable(
  "gigs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит задание
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    title: varchar("title", { length: 500 }).notNull(),
    description: text("description"),
    requirements: jsonb("requirements").$type<GigRequirements>(),

    // Тип задания
    type: gigTypeEnum("type").default("OTHER").notNull(),

    // Бюджет
    budgetMin: integer("budget_min"),
    budgetMax: integer("budget_max"),

    // Сроки
    deadline: timestamp("deadline", { withTimezone: true, mode: "date" }),
    estimatedDuration: varchar("estimated_duration", { length: 100 }), // "1-2 дня", "неделя"

    // Источник задания (платформа)
    source: platformSourceEnum("source").notNull().default("MANUAL"),
    externalId: varchar("external_id", { length: 100 }),
    url: text("url"),

    // Статистика
    views: integer("views").default(0),
    responses: integer("responses").default(0),
    newResponses: integer("new_responses").default(0),

    // Кастомные настройки для бота
    customBotInstructions: text("custom_bot_instructions"),
    customScreeningPrompt: text("custom_screening_prompt"),
    customInterviewQuestions: text("custom_interview_questions"),
    customOrganizationalQuestions: text("custom_organizational_questions"),

    // Кастомный домен для интервью
    customDomainId: uuid("custom_domain_id").references(() => customDomain.id, {
      onDelete: "set null",
    }),

    // Ссылка на сценарий интервью
    interviewScenarioId: uuid("interview_scenario_id").references(
      () => interviewScenario.id,
      {
        onDelete: "set null",
      },
    ),

    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("gig_workspace_idx").on(table.workspaceId),
    typeIdx: index("gig_type_idx").on(table.type),
    activeGigsIdx: index("gig_active_idx")
      .on(table.workspaceId, table.isActive)
      .where(sql`${table.isActive} = true`),
    sourceExternalIdx: index("gig_source_external_idx").on(
      table.source,
      table.externalId,
    ),
    deadlineIdx: index("gig_deadline_idx").on(table.deadline),
    requirementsIdx: index("gig_requirements_idx").using(
      "gin",
      table.requirements,
    ),
  }),
);

export const gigTypeValues = [
  "DEVELOPMENT",
  "DESIGN",
  "COPYWRITING",
  "MARKETING",
  "TRANSLATION",
  "VIDEO",
  "AUDIO",
  "DATA_ENTRY",
  "RESEARCH",
  "CONSULTING",
  "OTHER",
] as const;

export const CreateGigSchema = createInsertSchema(gig, {
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(gigTypeValues).default("OTHER"),
  budgetMin: z.number().int().positive().optional(),
  budgetMax: z.number().int().positive().optional(),

  deadline: z.coerce.date().optional(),
  estimatedDuration: z.string().max(100).optional(),
  source: z.enum(platformSourceValues).default("MANUAL"),
  externalId: z.string().max(100).optional(),
  url: z.url().optional(),
  customBotInstructions: z.string().max(5000).optional(),
  customScreeningPrompt: z.string().max(5000).optional(),
  customInterviewQuestions: z.string().max(5000).optional(),
  customOrganizationalQuestions: z.string().max(5000).optional(),
}).omit({
  id: true,
  views: true,
  responses: true,
  newResponses: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateGigSettingsSchema = z.object({
  customBotInstructions: z.string().max(5000).nullish(),
  customScreeningPrompt: z.string().max(5000).nullish(),
  customInterviewQuestions: z.string().max(5000).nullish(),
  customOrganizationalQuestions: z.string().max(5000).nullish(),
  customDomainId: z
    .union([z.uuid(), z.literal(""), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? null : val))
    .nullable(),
  interviewScenarioId: z
    .union([z.uuid(), z.literal(""), z.null(), z.undefined()])
    .transform((val) => (val === "" || val === undefined ? null : val))
    .nullable(),
});

export const CreateInterviewScenarioSchema = createInsertSchema(
  interviewScenario,
  {
    name: z.string().min(1).max(200),
    description: z.string().optional(),
    customBotInstructions: z.string().max(5000).optional(),
    customScreeningPrompt: z.string().max(5000).optional(),
    customInterviewQuestions: z.string().max(5000).optional(),
    customOrganizationalQuestions: z.string().max(5000).optional(),
  },
).omit({
  id: true,
  workspaceId: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateInterviewScenarioSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  customBotInstructions: z.string().max(5000).nullish(),
  customScreeningPrompt: z.string().max(5000).nullish(),
  customInterviewQuestions: z.string().max(5000).nullish(),
  customOrganizationalQuestions: z.string().max(5000).nullish(),
  isActive: z.boolean().optional(),
});

export type InterviewScenario = typeof interviewScenario.$inferSelect;
export type NewInterviewScenario = typeof interviewScenario.$inferInsert;

export type Gig = typeof gig.$inferSelect;
export type NewGig = typeof gig.$inferInsert;
