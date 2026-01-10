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
import { response } from "./response";

/**
 * Универсальная таблица для результатов скрининга откликов
 * Работает для gig, vacancy и других типов
 */
export const responseScreening = pgTable(
  "response_screenings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    responseId: uuid("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),

    // Оценки
    score: integer("score").notNull(), // Оценка от 0 до 5
    detailedScore: integer("detailed_score").notNull(), // Детальная оценка от 0 до 100

    // Анализ
    analysis: text("analysis"), // Общий анализ соответствия
    priceAnalysis: text("price_analysis"), // Анализ предложенной цены/зарплаты
    deliveryAnalysis: text("delivery_analysis"), // Анализ сроков/доступности
    skillsAnalysis: text("skills_analysis"), // Анализ навыков
    experienceAnalysis: text("experience_analysis"), // Анализ опыта

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    responseIdx: index("screening_response_idx").on(table.responseId),
    scoreIdx: index("screening_score_idx").on(table.score),
    detailedScoreIdx: index("screening_detailed_score_idx").on(
      table.detailedScore,
    ),
    scoreCheck: check(
      "screening_score_check",
      sql`${table.score} BETWEEN 0 AND 5`,
    ),
    detailedScoreCheck: check(
      "screening_detailed_score_check",
      sql`${table.detailedScore} BETWEEN 0 AND 100`,
    ),
  }),
);

export type ResponseScreening = typeof responseScreening.$inferSelect;
export type NewResponseScreening = typeof responseScreening.$inferInsert;
