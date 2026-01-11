import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { workspace } from "../workspace/workspace";

export const integration = pgTable(
  "integrations",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Workspace к которому принадлежит интеграция
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Тип интеграции (hh, linkedin, etc.)
    // Один workspace - одна интеграция каждого типа
    type: text("type").notNull(),

    // Название интеграции (для отображения)
    name: text("name").notNull(),

    // Credentials для авторизации (email, password, api_key, etc.)
    // Структура зависит от типа интеграции
    credentials: jsonb("credentials").notNull().$type<Record<string, string>>(),

    // Cookies для сохранения сессии
    cookies:
      jsonb("cookies").$type<
        Array<{
          name: string;
          value: string;
          domain?: string;
          path?: string;
          expires?: number;
          httpOnly?: boolean;
          secure?: boolean;
          sameSite?: "Strict" | "Lax" | "None";
        }>
      >(),

    // Дополнительные метаданные
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    // Активна ли интеграция
    isActive: boolean("is_active").default(true).notNull(),

    // Дата последнего использования
    lastUsedAt: timestamp("last_used_at", { withTimezone: true, mode: "date" }),

    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    // Уникальное ограничение: один workspace - одна интеграция каждого типа
    workspaceTypeUnique: unique().on(table.workspaceId, table.type),
    workspaceIdx: index("integration_workspace_idx").on(table.workspaceId),
    typeIdx: index("integration_type_idx").on(table.type),
    // Partial index для активных интеграций
    activeIntegrationsIdx: index("integration_active_idx")
      .on(table.workspaceId, table.isActive)
      .where(sql`${table.isActive} = true`),
    credentialsIdx: index("integration_credentials_idx").using(
      "gin",
      table.credentials,
    ),
    metadataIdx: index("integration_metadata_idx").using("gin", table.metadata),
  }),
);

export type Integration = typeof integration.$inferSelect;
export type NewIntegration = typeof integration.$inferInsert;
