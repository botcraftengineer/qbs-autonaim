import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Тип сущности для interview links (полиморфная связь)
 */
export const interviewLinkEntityTypeEnum = pgEnum(
  "interview_link_entity_type",
  ["gig", "vacancy", "project"],
);

/**
 * Универсальная таблица ссылок на интервью
 * Генерируются для приглашения кандидатов в чат
 */
export const interviewLink = pgTable(
  "interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь с сущностью
    entityType: interviewLinkEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    token: varchar("token", { length: 100 }).notNull().unique(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => ({
    entityIdx: index("interview_link_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    tokenIdx: index("interview_link_token_idx").on(table.token),
    activeIdx: index("interview_link_active_idx")
      .on(table.entityType, table.entityId, table.isActive)
      .where(sql`${table.isActive} = true`),
  }),
);

export type InterviewLink = typeof interviewLink.$inferSelect;
export type NewInterviewLink = typeof interviewLink.$inferInsert;
export type InterviewLinkEntityType =
  (typeof interviewLinkEntityTypeEnum.enumValues)[number];
