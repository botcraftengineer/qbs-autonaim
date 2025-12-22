import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { conversation } from "./conversation";

/**
 * Таблица для буферизации сообщений во время интервью
 * Изолирует буферы по conversationId и interviewStep
 */
export const messageBuffer = pgTable(
  "message_buffers",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, {
        onDelete: "cascade",
      }),
    userId: varchar("user_id", { length: 100 }).notNull(),
    interviewStep: integer("interview_step").notNull(),
    messages: jsonb("messages").notNull().$type<BufferedMessage[]>(),
    flushId: varchar("flush_id", { length: 100 }),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    lastUpdatedAt: bigint("last_updated_at", { mode: "number" }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    conversationStepIdx: index("message_buffer_conversation_step_idx").on(
      table.conversationId,
      table.interviewStep,
    ),
    userIdx: index("message_buffer_user_idx").on(table.userId),
    // Уникальный индекс для предотвращения дублирования буферов
    uniqueConversationStep: uniqueIndex("message_buffer_unique_idx").on(
      table.conversationId,
      table.interviewStep,
    ),
  }),
);

/**
 * Zod схема для BufferedMessage
 */
export const BufferedMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  contentType: z.enum(["TEXT", "VOICE"]),
  timestamp: z.number(),
  questionContext: z.string().optional(),
});

export type BufferedMessage = z.infer<typeof BufferedMessageSchema>;

/**
 * Zod схемы для валидации
 */
export const CreateMessageBufferSchema = createInsertSchema(messageBuffer, {
  conversationId: z.string().uuid(),
  userId: z.string().min(1),
  interviewStep: z.number().int().min(0),
  messages: z.array(BufferedMessageSchema),
  flushId: z.string().optional(),
  createdAt: z.number(),
  lastUpdatedAt: z.number(),
}).omit({
  id: true,
  updatedAt: true,
});

export const SelectMessageBufferSchema = createSelectSchema(messageBuffer);

export type MessageBuffer = z.infer<typeof SelectMessageBufferSchema>;
export type CreateMessageBuffer = z.infer<typeof CreateMessageBufferSchema>;
