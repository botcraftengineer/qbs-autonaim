/**
 * Agent Feedback Schema
 *
 * Хранит обратную связь от рекрутеров на рекомендации AI-агента.
 * Используется для:
 * - Отслеживания принятых/отклонённых рекомендаций
 * - Расчёта метрик качества
 * - Влияния на будущие рекомендации
 *
 * Requirements: 10.1, 10.2, 10.4
 */

import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

/**
 * Тип обратной связи
 */
export const feedbackTypeEnum = pgEnum("agent_feedback_type", [
  "accepted",
  "rejected",
  "modified",
  "error_report",
]);

/**
 * Таблица обратной связи от рекрутеров
 */
export const agentFeedback = pgTable(
  "agent_feedback",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace для tenant isolation
    workspaceId: text("workspace_id").notNull(),

    // Пользователь, оставивший feedback
    userId: text("user_id").notNull(),

    // ID действия агента (опционально)
    actionId: uuid("action_id"),

    // ID рекомендации (опционально)
    recommendationId: uuid("recommendation_id"),

    // Тип обратной связи
    feedbackType: feedbackTypeEnum("feedback_type").notNull(),

    // Оригинальная рекомендация агента
    originalRecommendation: text("original_recommendation"),

    // Действие пользователя (что сделал вместо рекомендации)
    userAction: text("user_action"),

    // Причина отклонения/модификации
    reason: text("reason"),

    // Рейтинг (1-5)
    rating: integer("rating"),

    // Дополнительные метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // Индекс по workspace для tenant isolation
    workspaceIdx: index("agent_feedback_workspace_idx").on(table.workspaceId),

    // Индекс по пользователю
    userIdx: index("agent_feedback_user_idx").on(table.userId),

    // Индекс по типу feedback
    feedbackTypeIdx: index("agent_feedback_type_idx").on(table.feedbackType),

    // Composite индекс для поиска по workspace и времени
    workspaceCreatedAtIdx: index("agent_feedback_workspace_created_at_idx").on(
      table.workspaceId,
      table.createdAt,
    ),

    // Composite индекс для поиска по пользователю и workspace
    userWorkspaceIdx: index("agent_feedback_user_workspace_idx").on(
      table.userId,
      table.workspaceId,
    ),
  }),
);

/**
 * Zod схемы для валидации
 */
export const InsertAgentFeedbackSchema = createInsertSchema(agentFeedback, {
  rating: (schema) => schema.min(1).max(5).optional(),
  reason: (schema) => schema.max(1000).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectAgentFeedbackSchema = createSelectSchema(agentFeedback);

/**
 * TypeScript типы
 */
export type AgentFeedback = typeof agentFeedback.$inferSelect;
export type NewAgentFeedback = typeof agentFeedback.$inferInsert;
export type InsertAgentFeedback = z.infer<typeof InsertAgentFeedbackSchema>;
