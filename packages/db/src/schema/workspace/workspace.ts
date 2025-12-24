import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization } from "../organization/organization";

export const workspace = pgTable(
  "workspaces",
  {
    id: text("id").primaryKey().default(sql`workspace_id_generate()`),

    // Организация, которой принадлежит workspace
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
      }),

    // Название workspace (компании)
    name: text("name").notNull(),

    // Уникальный slug для URL (уникален в рамках организации)
    slug: text("slug").notNull(),

    // Описание компании
    description: text("description"),

    // Сайт компании
    website: text("website"),

    // Логотип
    logo: text("logo"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Уникальность slug в рамках организации
    uniqueSlugPerOrg: unique().on(table.organizationId, table.slug),
  }),
);

export type Workspace = typeof workspace.$inferSelect;
export type NewWorkspace = typeof workspace.$inferInsert;
