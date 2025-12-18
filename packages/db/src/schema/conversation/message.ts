import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { file } from "../file/file";
import { conversation } from "./conversation";

export const messageSenderEnum = pgEnum("message_sender", [
  "CANDIDATE",
  "BOT",
  "ADMIN",
]);

export const messageContentTypeEnum = pgEnum("message_content_type", [
  "TEXT",
  "VOICE",
]);

export const conversationMessage = pgTable("conversation_messages", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  conversationId: uuid("conversation_id")
    .notNull()
    .references(() => conversation.id, { onDelete: "cascade" }),
  sender: messageSenderEnum("sender").notNull(),
  contentType: messageContentTypeEnum("content_type").default("TEXT").notNull(),
  content: text("content").notNull(),
  fileId: uuid("file_id").references(() => file.id, { onDelete: "set null" }),
  voiceDuration: varchar("voice_duration", { length: 20 }),
  voiceTranscription: text("voice_transcription"),
  externalMessageId: varchar("external_message_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const CreateMessageSchema = createInsertSchema(conversationMessage, {
  conversationId: uuidv7Schema,
  sender: z.enum(["CANDIDATE", "BOT", "ADMIN"]),
  contentType: z.enum(["TEXT", "VOICE"]).default("TEXT"),
  content: z.string(),
  fileId: uuidv7Schema.optional(),
  voiceDuration: z.string().max(20).optional(),
  voiceTranscription: z.string().optional(),
  externalMessageId: z.string().max(100).optional(),
}).omit({
  id: true,
  createdAt: true,
});
