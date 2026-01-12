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

import { workspace } from "../workspace/workspace";

/**
 * Тип кастомного домена
 */
export const domainTypeEnum = pgEnum("domain_type", [
  "interview", // Для ссылок на интервью
  "prequalification", // Для форм предквалификации
]);

/**
 * Предустановленные домены для интервью
 */
export const presetInterviewDomains = [
  {
    id: "hrbot.pro",
    domain: "hrbot.pro",
    label: "hrbot.pro",
  },
] as const;

export type PresetInterviewDomain = (typeof presetInterviewDomains)[number];

/**
 * SSL статус для кастомного домена
 */
export const sslStatusEnum = pgEnum("ssl_status", [
  "pending",
  "active",
  "error",
  "expired",
]);

/**
 * Кастомные домены для workspace
 * Позволяет каждому workspace использовать собственные домены для различных целей
 */
export const customDomain = pgTable(
  "custom_domains",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    domain: varchar("domain", { length: 255 }).notNull(),
    type: domainTypeEnum("type").notNull().default("interview"),
    cnameTarget: varchar("cname_target", { length: 255 }).notNull(),
    isVerified: boolean("is_verified").default(false).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    verificationError: text("verification_error"),
    lastVerificationAttempt: timestamp("last_verification_attempt", {
      withTimezone: true,
      mode: "date",
    }),
    sslStatus: sslStatusEnum("ssl_status").default("pending").notNull(),
    sslCertificateId: varchar("ssl_certificate_id", { length: 255 }),
    sslExpiresAt: timestamp("ssl_expires_at", {
      withTimezone: true,
      mode: "date",
    }),
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

export const createCustomDomainSchema = createInsertSchema(customDomain, {
  domain: z
    .string()
    .min(3)
    .max(255)
    .regex(
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/,
      "Некорректный формат домена",
    ),
  type: z.enum(["interview", "prequalification"]).default("interview"),
  cnameTarget: z.string().min(1).max(255),
  isVerified: z.boolean().default(false),
  isPrimary: z.boolean().default(false),
  sslStatus: z
    .enum(["pending", "active", "error", "expired"])
    .default("pending"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  verifiedAt: true,
  verificationError: true,
  lastVerificationAttempt: true,
  sslCertificateId: true,
  sslExpiresAt: true,
});

export const updateCustomDomainSchema = createCustomDomainSchema.partial();

export type CustomDomain = typeof customDomain.$inferSelect;
export type CreateCustomDomain = z.infer<typeof createCustomDomainSchema>;
export type UpdateCustomDomain = z.infer<typeof updateCustomDomainSchema>;
export type DomainType = (typeof domainTypeEnum.enumValues)[number];
export type SSLStatus = (typeof sslStatusEnum.enumValues)[number];

/**
 * Проверяет, является ли домен предустановленным
 */
export function isPresetDomain(domain: string): boolean {
  return presetInterviewDomains.some((preset) => preset.domain === domain);
}

/**
 * Получает предустановленный домен по ID
 */
export function getPresetDomain(idOrDomain: string) {
  return presetInterviewDomains.find(
    (preset) => preset.id === idOrDomain || preset.domain === idOrDomain,
  );
}
