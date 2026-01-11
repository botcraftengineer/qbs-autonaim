import { sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const botSettings = pgTable(
  "bot_settings",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Связь с workspace
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" })
      .unique(),

    // Настройки бота
    botName: text("bot_name").default("Дмитрий").notNull(),
    botRole: text("bot_role").default("рекрутер").notNull(),

    // Информация о компании (для контекста бота)
    companyName: text("company_name").notNull(),
    companyWebsite: text("company_website"),
    companyDescription: text("company_description"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("bot_settings_workspace_idx").on(table.workspaceId),
  }),
);

export type BotSettings = typeof botSettings.$inferSelect;
export type NewBotSettings = typeof botSettings.$inferInsert;
