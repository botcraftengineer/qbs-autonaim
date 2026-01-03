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

// SSL Status Enum
export const sslStatusEnum = pgEnum("ssl_status", [
  "pending",
  "active",
  "expired",
  "error",
]);

// Custom Domain Table
export const customDomain = pgTable(
  "custom_domains",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит домен
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Доменное имя (уникальное)
    domain: varchar("domain", { length: 255 }).notNull().unique(),

    // CNAME target для DNS
    cnameTarget: varchar("cname_target", { length: 255 }).notNull(),

    // Статус верификации
    verified: boolean("verified").default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true, mode: "date" }),
    lastVerificationAttempt: timestamp("last_verification_attempt", {
      withTimezone: true,
      mode: "date",
    }),
    verificationError: text("verification_error"),

    // SSL статус
    sslStatus: sslStatusEnum("ssl_status").default("pending"),
    sslCertificateId: varchar("ssl_certificate_id", { length: 255 }),
    sslExpiresAt: timestamp("ssl_expires_at", {
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
    workspaceIdx: index("custom_domain_workspace_idx").on(table.workspaceId),
    domainIdx: index("custom_domain_domain_idx").on(table.domain),
  }),
);

// Zod schemas
export const CreateCustomDomainSchema = createInsertSchema(customDomain, {
  workspaceId: z.string().min(1),
  domain: z
    .string()
    .min(1)
    .max(255)
    .regex(
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
      "Invalid domain format",
    ),
  cnameTarget: z.string().min(1).max(255),
}).omit({
  id: true,
  verified: true,
  verifiedAt: true,
  lastVerificationAttempt: true,
  verificationError: true,
  sslStatus: true,
  sslCertificateId: true,
  sslExpiresAt: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type CustomDomain = typeof customDomain.$inferSelect;
export type NewCustomDomain = typeof customDomain.$inferInsert;
export type SSLStatus = (typeof sslStatusEnum.enumValues)[number];
