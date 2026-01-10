import { sql } from "drizzle-orm";
import { check, integer, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Базовые колонки для скрининга
 */
export const screeningScoreColumns = {
  score: integer("score").notNull(), // Оценка от 0 до 5
  detailedScore: integer("detailed_score").notNull(), // Детальная оценка от 0 до 100
};

/**
 * Колонки анализа скрининга
 */
export const screeningAnalysisColumns = {
  analysis: text("analysis"), // Общий анализ соответствия
  priceAnalysis: text("price_analysis"), // Анализ предложенной цены/зарплаты
  deliveryAnalysis: text("delivery_analysis"), // Анализ сроков/доступности
};

/**
 * Временные метки скрининга
 */
export const screeningTimestampColumns = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

/**
 * Создаёт check constraints для score полей
 * Используется в extraConfig pgTable
 */
export function createScoreChecks(
  table: {
    score: typeof screeningScoreColumns.score;
    detailedScore: typeof screeningScoreColumns.detailedScore;
  },
  prefix: string,
) {
  return {
    scoreCheck: check(
      `${prefix}_score_check`,
      sql`${table.score} BETWEEN 0 AND 5`,
    ),
    detailedScoreCheck: check(
      `${prefix}_detailed_score_check`,
      sql`${table.detailedScore} BETWEEN 0 AND 100`,
    ),
  };
}
