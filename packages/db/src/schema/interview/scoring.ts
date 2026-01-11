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
import { gigResponse } from "../gig/response";
import { vacancyResponse } from "../vacancy/response";
import { interviewSession } from "./interview-session";

/**
 * Результаты скоринга интервью
 * Связан с interviewSession (не chatSession)
 */
export const interviewScoring = pgTable(
  "interview_scorings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // FK на сессию интервью
    interviewSessionId: uuid("interview_session_id")
      .notNull()
      .unique()
      .references(() => interviewSession.id, { onDelete: "cascade" }),

    // FK на conversation (универсальная таблица)
    conversationId: uuid("conversation_id"),

    // Опциональные FK на отклики (для удобства запросов)
    responseId: uuid("response_id").references(() => vacancyResponse.id, {
      onDelete: "cascade",
    }),
    gigResponseId: uuid("gig_response_id").references(() => gigResponse.id, {
      onDelete: "cascade",
    }),

    // Оценки (унифицированная шкала 0-100)
    score: integer("score").notNull(), // Основной скоринг 0-100
    rating: integer("rating"), // Звездный рейтинг 0-5 (удобно для UI)
    analysis: text("analysis"), // Анализ на основе интервью

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    interviewSessionIdx: index("interview_scoring_session_idx").on(
      table.interviewSessionId,
    ),
    responseIdx: index("interview_scoring_response_idx").on(table.responseId),
    gigResponseIdx: index("interview_scoring_gig_response_idx").on(
      table.gigResponseId,
    ),
    scoreCheck: check(
      "interview_scoring_score_check",
      sql`${table.score} BETWEEN 0 AND 100`,
    ),
    ratingCheck: check(
      "interview_scoring_rating_check",
      sql`${table.rating} IS NULL OR ${table.rating} BETWEEN 0 AND 5`,
    ),
  }),
);

export const CreateInterviewScoringSchema = createInsertSchema(
  interviewScoring,
  {
    interviewSessionId: uuidv7Schema,
    conversationId: uuidv7Schema.optional(),
    responseId: uuidv7Schema.optional(),
    gigResponseId: uuidv7Schema.optional(),
    rating: z.number().int().min(0).max(5).optional(),
    score: z.number().int().min(0).max(100),
    analysis: z.string().optional(),
  },
).omit({
  id: true,
  createdAt: true,
});
