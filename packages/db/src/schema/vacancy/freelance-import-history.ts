import { sql } from "drizzle-orm";
import {
  index,
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

import { user } from "../auth";
import { vacancy } from "./vacancy";

export const importModeEnum = pgEnum("import_mode", ["SINGLE", "BULK"]);

export const freelanceImportHistory = pgTable(
  "freelance_import_history",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    vacancyId: uuid("vacancy_id")
      .notNull()
      .references(() => vacancy.id, { onDelete: "cascade" }),
    // Исправлено: тип text для соответствия user.id (Clerk ID)
    importedBy: text("imported_by")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    importMode: importModeEnum("import_mode").notNull(),
    platformSource: varchar("platform_source", { length: 50 }).notNull(),
    rawText: text("raw_text"),
    parsedCount: integer("parsed_count").default(0).notNull(),
    successCount: integer("success_count").default(0).notNull(),
    failureCount: integer("failure_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("freelance_import_vacancy_idx").on(table.vacancyId),
    index("freelance_import_user_idx").on(table.importedBy),
    index("freelance_import_platform_idx").on(table.platformSource),
    index("freelance_import_created_idx").on(table.createdAt),
  ],
);

export const CreateFreelanceImportHistorySchema = createInsertSchema(
  freelanceImportHistory,
  {
    importMode: z.enum(["SINGLE", "BULK"]),
    platformSource: z.string().max(50),
    rawText: z.string().optional(),
    parsedCount: z.number().int().min(0).default(0),
    successCount: z.number().int().min(0).default(0),
    failureCount: z.number().int().min(0).default(0),
  },
).omit({
  id: true,
  createdAt: true,
});

export type FreelanceImportHistory = typeof freelanceImportHistory.$inferSelect;
