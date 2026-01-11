import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import type { z } from "zod";

export const auditActionEnum = pgEnum("audit_action", [
  "VIEW",
  "EXPORT",
  "UPDATE",
  "DELETE",
  "ACCESS",
  "CREATE",
  "EVALUATE",
  "SUBMIT",
]);

export const auditResourceTypeEnum = pgEnum("audit_resource_type", [
  "VACANCY_RESPONSE",
  "CONVERSATION",
  "RESUME",
  "CONTACT_INFO",
  "VACANCY",
  "PREQUALIFICATION_SESSION",
  "WIDGET_CONFIG",
  "CUSTOM_DOMAIN",
  "RULE",
]);

export const auditLog = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Пользователь, выполнивший действие
    userId: text("user_id").notNull(),

    // Workspace для tenant isolation (опционально для обратной совместимости)
    workspaceId: text("workspace_id"),

    // Действие
    action: auditActionEnum("action").notNull(),

    // Тип ресурса
    resourceType: auditResourceTypeEnum("resource_type").notNull(),

    // ID ресурса
    resourceId: text("resource_id").notNull(),

    // Дополнительные метаданные (опционально)
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // IP адрес пользователя (опционально)
    ipAddress: varchar("ip_address", { length: 45 }),

    // User agent (опционально)
    userAgent: text("user_agent"),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("audit_log_user_idx").on(table.userId),
    workspaceIdx: index("audit_log_workspace_idx").on(table.workspaceId),
    resourceIdx: index("audit_log_resource_idx").on(
      table.resourceType,
      table.resourceId,
    ),
    actionIdx: index("audit_log_action_idx").on(table.action),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
    // Composite index для поиска по пользователю и времени
    userCreatedAtIdx: index("audit_log_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    // Composite index для поиска по workspace и времени
    workspaceCreatedAtIdx: index("audit_log_workspace_created_at_idx").on(
      table.workspaceId,
      table.createdAt,
    ),
    metadataIdx: index("audit_log_metadata_idx").using("gin", table.metadata),
  }),
);

export const CreateAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  createdAt: true,
});

export type AuditLog = typeof auditLog.$inferSelect;
export type CreateAuditLog = z.infer<typeof CreateAuditLogSchema>;
