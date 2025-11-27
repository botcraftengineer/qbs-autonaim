import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const companySettings = pgTable("company_settings", {
  id: text("id").primaryKey().default("default"),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
