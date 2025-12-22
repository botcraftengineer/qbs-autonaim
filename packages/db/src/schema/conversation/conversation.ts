import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { vacancyResponse } from "../vacancy/response";

export const conversationStatusEnum = pgEnum("conversation_status", [
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const conversation = pgTable("conversations", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
  responseId: uuid("response_id")
    .notNull()
    .unique()
    .references(() => vacancyResponse.id, {
      onDelete: "cascade",
    }),
  candidateName: varchar("candidate_name", { length: 500 }),
  username: varchar("username", { length: 100 }),
  status: conversationStatusEnum("status").default("ACTIVE").notNull(),
  metadata: text("metadata"),
  metadataVersion: integer("metadata_version").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const CreateConversationSchema = createInsertSchema(conversation, {
  responseId: uuidv7Schema,
  candidateName: z.string().max(500).optional(),
  username: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
  metadata: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
