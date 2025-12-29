import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { conversation } from "../conversation/conversation";
import { vacancyResponse } from "../vacancy/response";

/**
 * Универсальная таблица для результатов скоринга интервью
 * Используется для всех источников: Telegram, Web и других
 */
export const interviewScoring = pgTable("interview_scorings", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  conversationId: uuid("conversation_id")
    .notNull()
    .unique()
    .references(() => conversation.id, { onDelete: "cascade" }),
  responseId: uuid("response_id").references(() => vacancyResponse.id, {
    onDelete: "cascade",
  }),
  score: integer("score").notNull(), // Оценка от 0 до 5
  detailedScore: integer("detailed_score").notNull(), // Детальная оценка от 0 до 100
  analysis: text("analysis"), // Анализ на основе интервью
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const CreateInterviewScoringSchema = createInsertSchema(
  interviewScoring,
  {
    conversationId: uuidv7Schema,
    responseId: uuidv7Schema.optional(),
    score: z.number().int().min(0).max(5),
    detailedScore: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});
