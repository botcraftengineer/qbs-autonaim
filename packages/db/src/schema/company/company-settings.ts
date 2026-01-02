import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const companySettings = pgTable(
  "company_settings",
  {
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

    // Настройки онбординга
    onboardingCompleted: boolean("onboarding_completed").default(false),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
      mode: "date",
    }),
    dismissedGettingStarted: boolean("dismissed_getting_started").default(
      false,
    ),
    dismissedGettingStartedAt: timestamp("dismissed_getting_started_at", {
      withTimezone: true,
      mode: "date",
    }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("company_settings_workspace_idx").on(table.workspaceId),
  }),
);

export type CompanySettings = typeof companySettings.$inferSelect;
export type NewCompanySettings = typeof companySettings.$inferInsert;
