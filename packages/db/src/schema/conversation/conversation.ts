import { uuidv7Schema } from "@qbs-autonaim/validators";
import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
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

export const conversation = pgTable(
  "conversations",
  {
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
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    statusIdx: index("conversation_status_idx").on(table.status),
    // Partial index для активных разговоров
    activeConversationsIdx: index("conversation_active_idx")
      .on(table.status)
      .where(sql`${table.status} = 'ACTIVE'`),
  }),
);

export const CreateConversationSchema = createInsertSchema(conversation, {
  responseId: uuidv7Schema,
  candidateName: z.string().max(500).optional(),
  username: z.string().max(100).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
