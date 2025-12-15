import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const companySettings = pgTable("company_settings", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  // Связь с workspace
  workspaceId: text("workspace_id")
    .notNull()
    .references(() => workspace.id, { onDelete: "cascade" })
    .unique(),

  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),

  // Настройки бота
  botName: text("bot_name").default("Дмитрий"),
  botRole: text("bot_role").default("рекрутер"),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;
