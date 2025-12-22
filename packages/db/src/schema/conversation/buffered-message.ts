import { sql } from "drizzle-orm";
import {
  bigint,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { conversation } from "./conversation";

/**
 * Таблица для хранения отдельных буферизованных сообщений
 * Каждое сообщение в отдельной строке для предотвращения затирания
 */
export const bufferedMessage = pgTable(
  "buffered_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    messageId: varchar("message_id", { length: 100 }).notNull(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversation.id, {
        onDelete: "cascade",
      }),
    userId: varchar("user_id", { length: 100 }).notNull(),
    interviewStep: integer("interview_step").notNull(),
    content: varchar("content", { length: 10000 }).notNull(),
    contentType: varchar("content_type", { length: 20 }).notNull(),
    questionContext: varchar("question_context", { length: 1000 }),
    timestamp: bigint("timestamp", { mode: "number" }).notNull(),
    flushId: varchar("flush_id", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    conversationStepIdx: index("buffered_message_conversation_step_idx").on(
      table.conversationId,
      table.interviewStep,
    ),
    userIdx: index("buffered_message_user_idx").on(table.userId),
    messageIdIdx: index("buffered_message_id_idx").on(table.messageId),
    timestampIdx: index("buffered_message_timestamp_idx").on(table.timestamp),
  }),
);

/**
 * Zod схемы для валидации
 */
export const CreateBufferedMessageSchema = createInsertSchema(bufferedMessage, {
  messageId: z.string().min(1),
  conversationId: z.string().uuid(),
  userId: z.string().min(1),
  interviewStep: z.number().int().min(0),
  content: z.string().min(1),
  contentType: z.enum(["TEXT", "VOICE"]),
  questionContext: z.string().optional(),
  timestamp: z.number(),
  flushId: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const SelectBufferedMessageSchema = createSelectSchema(bufferedMessage);

export type BufferedMessage = z.infer<typeof SelectBufferedMessageSchema>;
export type CreateBufferedMessage = z.infer<typeof CreateBufferedMessageSchema>;
