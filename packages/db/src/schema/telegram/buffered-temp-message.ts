import { sql } from "drizzle-orm";
import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import {
  tempMessageContentTypeEnum,
  tempMessageSenderEnum,
} from "./temp-message";

/**
 * Буферизованные временные сообщения для неидентифицированных пользователей
 * Используется для накопления сообщений перед отправкой в AI
 * После обработки переносятся в temp_conversation_messages
 */
export const bufferedTempMessage = pgTable(
  "buffered_temp_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    messageId: varchar("message_id", { length: 100 }).notNull(),
    tempConversationId: varchar("temp_conversation_id", {
      length: 100,
    }).notNull(),
    chatId: varchar("chat_id", { length: 100 }).notNull(),
    sender: tempMessageSenderEnum("sender").notNull(),
    contentType: tempMessageContentTypeEnum("content_type")
      .default("TEXT")
      .notNull(),
    content: text("content").notNull(),
    externalMessageId: varchar("external_message_id", { length: 100 }),
    timestamp: timestamp("timestamp").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("buffered_temp_message_conversation_idx").on(
      table.tempConversationId,
    ),
    chatIdx: index("buffered_temp_message_chat_idx").on(table.chatId),
    messageIdIdx: index("buffered_temp_message_id_idx").on(table.messageId),
    timestampIdx: index("buffered_temp_message_timestamp_idx").on(
      table.timestamp,
    ),
  }),
);

export const CreateBufferedTempMessageSchema = createInsertSchema(
  bufferedTempMessage,
  {
    messageId: z.string().min(1).max(100),
    tempConversationId: z.string().max(100),
    chatId: z.string().max(100),
    sender: z.enum(["CANDIDATE", "BOT"]),
    contentType: z.enum(["TEXT", "VOICE"]).default("TEXT"),
    content: z.string().transform((val) => val.replace(/\0/g, "")),
    externalMessageId: z.string().max(100).optional(),
    timestamp: z.date(),
  },
).omit({
  id: true,
  createdAt: true,
});

export const SelectBufferedTempMessageSchema =
  createSelectSchema(bufferedTempMessage);

export type BufferedTempMessage = z.infer<
  typeof SelectBufferedTempMessageSchema
>;
export type CreateBufferedTempMessage = z.infer<
  typeof CreateBufferedTempMessageSchema
>;
