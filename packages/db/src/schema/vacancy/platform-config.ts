import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const platformConfig = pgTable(
  "platform_config",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    platformCode: varchar("platform_code", { length: 50 }).notNull().unique(),
    platformName: varchar("platform_name", { length: 200 }).notNull(),
    profileUrlPattern: text("profile_url_pattern"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    platformCodeIdx: index("platform_config_code_idx").on(table.platformCode),
    activeIdx: index("platform_config_active_idx")
      .on(table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export const CreatePlatformConfigSchema = createInsertSchema(platformConfig, {
  platformCode: z.string().max(50),
  platformName: z.string().max(200),
  profileUrlPattern: z.string().optional(),
  isActive: z.boolean().default(true),
}).omit({
  id: true,
  createdAt: true,
});

export type PlatformConfig = typeof platformConfig.$inferSelect;
