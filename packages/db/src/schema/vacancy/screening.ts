import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { vacancyResponse } from "./response";

/**
 * Таблица для результатов скрининга откликов
 */
export const responseScreening = pgTable("response_screenings", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  responseId: uuid("response_id")
    .notNull()
    .references(() => vacancyResponse.id, { onDelete: "cascade" }),
  score: integer("score").notNull(), // Оценка от 1 до 5
  detailedScore: integer("detailed_score").notNull(), // Детальная оценка от 0 до 100
  analysis: text("analysis"), // Анализ соответствия резюме вакансии
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const CreateResponseScreeningSchema = createInsertSchema(
  responseScreening,
  {
    responseId: uuidv7Schema,
    score: z.number().int().min(1).max(5),
    detailedScore: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});
