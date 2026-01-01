import { sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { gigResponse } from "../gig/response";

/**
 * Статус исходящего сообщения
 */
export const outgoingMessageStatusEnum = pgEnum("outgoing_message_status", [
  "PENDING_SEND",
  "SENT",
  "FAILED",
  "CANCELLED",
]);

/**
 * Таблица исходящих сообщений для отправки через Telegram
 */
export const outgoingMessage = pgTable(
  "outgoing_messages",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Связь с откликом на gig
    gigResponseId: uuid("gig_response_id")
      .notNull()
      .references(() => gigResponse.id, { onDelete: "cascade" }),

    // Отправитель (ID пользователя из сессии)
    senderId: uuid("sender_id").notNull(),

    // Получатель
    recipientTelegramUsername: varchar("recipient_telegram_username", {
      length: 100,
    }).notNull(),
    recipientChatId: varchar("recipient_chat_id", { length: 100 }),

    // Содержимое сообщения
    message: text("message").notNull(),

    // Статус отправки
    status: outgoingMessageStatusEnum("status")
      .default("PENDING_SEND")
      .notNull(),

    // Метаданные отправки
    sentAt: timestamp("sent_at", { withTimezone: true, mode: "date" }),
    failureReason: text("failure_reason"),
    externalMessageId: varchar("external_message_id", { length: 100 }),

    // Даты
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    gigResponseIdx: index("outgoing_message_gig_response_idx").on(
      table.gigResponseId,
    ),
    statusIdx: index("outgoing_message_status_idx").on(table.status),
    senderIdx: index("outgoing_message_sender_idx").on(table.senderId),
    recipientIdx: index("outgoing_message_recipient_idx").on(
      table.recipientTelegramUsername,
    ),
    // Composite index для поиска pending сообщений
    statusCreatedIdx: index("outgoing_message_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  }),
);

export const outgoingMessageStatusValues = [
  "PENDING_SEND",
  "SENT",
  "FAILED",
  "CANCELLED",
] as const;

export const CreateOutgoingMessageSchema = createInsertSchema(outgoingMessage, {
  gigResponseId: z.string().uuid(),
  senderId: z.string().uuid(),
  recipientTelegramUsername: z.string().min(1).max(100),
  recipientChatId: z.string().max(100).optional(),
  message: z.string().min(1),
  status: z.enum(outgoingMessageStatusValues).default("PENDING_SEND"),
  failureReason: z.string().optional(),
  externalMessageId: z.string().max(100).optional(),
}).omit({
  id: true,
  sentAt: true,
  createdAt: true,
  updatedAt: true,
});

export type OutgoingMessage = typeof outgoingMessage.$inferSelect;
export type NewOutgoingMessage = typeof outgoingMessage.$inferInsert;
