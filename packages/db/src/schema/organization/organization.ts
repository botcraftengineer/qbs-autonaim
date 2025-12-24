import { sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const organization = pgTable("organizations", {
  id: text("id").primaryKey().default(sql`organization_id_generate()`),

  // Название организации
  name: text("name").notNull(),

  // Уникальный slug для URL
  slug: text("slug").notNull().unique(),

  // Описание организации
  description: text("description"),

  // Сайт организации
  website: text("website"),

  // Логотип
  logo: text("logo"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;
