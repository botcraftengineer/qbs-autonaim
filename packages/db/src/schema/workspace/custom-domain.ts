import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { workspace } from "./workspace";

/**
 * Тип кастомного домена
 */
export const domainTypeEnum = pgEnum("domain_type", [
  "interview", // Для ссылок на интервью
  "prequalification", // Для форм предквалификации
]);

/**
 * Кастомные домены для workspace
 * Позволяет каждому workspace использовать собственные домены для различных целей
 */
export const workspaceCustomDomain = pgTable(
  "custom_domains",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    type: domainTypeEnum("type").notNull().default("interview"),
    isVerified: boolean("is_verified").default(false).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    verificationToken: varchar("verification_token", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    workspaceIdx: index("custom_domain_workspace_idx").on(table.workspaceId),
    domainIdx: index("custom_domain_domain_idx").on(table.domain),
    typeIdx: index("custom_domain_type_idx").on(table.type),
    primaryIdx: index("custom_domain_primary_idx")
      .on(table.workspaceId, table.type, table.isPrimary)
      .where(sql`${table.isPrimary} = true`),
    uniqueDomainType: index("custom_domain_unique_domain_type").on(
      table.domain,
      table.type,
    ),
  }),
);

export const CreateWorkspaceCustomDomainSchema = createInsertSchema(
  workspaceCustomDomain,
  {
    domain: z
      .string()
      .min(3)
      .max(255)
      .regex(
        /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
        "Некорректный формат домена",
      ),
    type: z.enum(["interview", "prequalification"]).default("interview"),
    isVerified: z.boolean().default(false),
    isPrimary: z.boolean().default(false),
  },
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  verificationToken: true,
});

export const UpdateWorkspaceCustomDomainSchema =
  CreateWorkspaceCustomDomainSchema.partial();

export type WorkspaceCustomDomain = typeof workspaceCustomDomain.$inferSelect;
export type CreateWorkspaceCustomDomain = z.infer<
  typeof CreateWorkspaceCustomDomainSchema
>;
export type UpdateWorkspaceCustomDomain = z.infer<
  typeof UpdateWorkspaceCustomDomainSchema
>;
export type DomainType = (typeof domainTypeEnum.enumValues)[number];
