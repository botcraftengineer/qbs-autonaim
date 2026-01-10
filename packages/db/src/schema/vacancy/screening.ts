import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vacancyResponse } from "./response";

/**
 * Таблица для результатов скрининга откликов на вакансии
 */
export const vacancyResponseScreening = pgTable(
  "vacancy_response_screenings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => vacancyResponse.id, { onDelete: "cascade" }),

    // Оценки
    score: integer("score").notNull(), // Оценка от 0 до 5
    detailedScore: integer("detailed_score").notNull(), // Детальная оценка от 0 до 100

    // Анализ
    analysis: text("analysis"), // Анализ соответствия резюме вакансии
    skillsAnalysis: text("skills_analysis"), // Анализ навыков
    experienceAnalysis: text("experience_analysis"), // Анализ опыта

    // Временные метки
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    responseIdx: index("vacancy_screening_response_idx").on(table.responseId),
    scoreIdx: index("vacancy_screening_score_idx").on(table.score),
    detailedScoreIdx: index("vacancy_screening_detailed_score_idx").on(
      table.detailedScore,
    ),
    scoreCheck: check(
      "vacancy_score_check",
      sql`${table.score} BETWEEN 0 AND 5`,
    ),
    detailedScoreCheck: check(
      "vacancy_detailed_score_check",
      sql`${table.detailedScore} BETWEEN 0 AND 100`,
    ),
  }),
);

export const CreateVacancyResponseScreeningSchema = createInsertSchema(
  vacancyResponseScreening,
  {
    responseId: uuidv7Schema,
    score: z.number().int().min(0).max(5),
    detailedScore: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
    skillsAnalysis: z.string().optional(),
    experienceAnalysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type VacancyResponseScreening =
  typeof vacancyResponseScreening.$inferSelect;
export type NewVacancyResponseScreening =
  typeof vacancyResponseScreening.$inferInsert;

// Backward compatibility alias
export const responseScreening = vacancyResponseScreening;
export const CreateResponseScreeningSchema =
  CreateVacancyResponseScreeningSchema;
