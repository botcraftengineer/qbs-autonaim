import { sql } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { response } from "./response";

/**
 * Универсальная таблица результатов скрининга откликов
 */
export const responseScreening = pgTable(
  "response_screenings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    responseId: uuid("response_id")
      .notNull()
      .unique()
      .references(() => response.id, { onDelete: "cascade" }),

    // Оценки
    score: integer("score").notNull(), // 0-5
    detailedScore: integer("detailed_score").notNull(), // 0-100

    // Анализ
    analysis: text("analysis"),
    priceAnalysis: text("price_analysis"),
    deliveryAnalysis: text("delivery_analysis"),
    skillsAnalysis: text("skills_analysis"),
    experienceAnalysis: text("experience_analysis"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("response_screening_response_idx").on(table.responseId),
    index("response_screening_score_idx").on(table.score),
    index("response_screening_detailed_score_idx").on(table.detailedScore),
  ],
);

export const CreateResponseScreeningSchema = createInsertSchema(
  responseScreening,
  {
    responseId: z.string().uuid(),
    score: z.number().int().min(0).max(5),
    detailedScore: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
    priceAnalysis: z.string().optional(),
    deliveryAnalysis: z.string().optional(),
    skillsAnalysis: z.string().optional(),
    experienceAnalysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ResponseScreening = typeof responseScreening.$inferSelect;
export type NewResponseScreening = typeof responseScreening.$inferInsert;
