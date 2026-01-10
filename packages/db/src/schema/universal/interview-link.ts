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
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Тип сущности для ссылок на интервью
 */
export const interviewLinkEntityTypeEnum = pgEnum(
  "interview_link_entity_type",
  ["gig", "vacancy", "project"],
);

/**
 * Ссылки на интервью для сущностей
 */
export const interviewLink = pgTable(
  "interview_links",
  {
    id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

    // Полиморфная связь
    entityType: interviewLinkEntityTypeEnum("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),

    // Backward compatibility - прямая связь с vacancy
    vacancyId: uuid("vacancy_id"),

    // Токен ссылки
    token: varchar("token", { length: 100 }).notNull().unique(),

    // Активна ли ссылка
    isActive: boolean("is_active").default(true).notNull(),

    // Дата истечения
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("interview_link_entity_idx").on(table.entityType, table.entityId),
    index("interview_link_vacancy_idx").on(table.vacancyId),
    index("interview_link_token_idx").on(table.token),
    index("interview_link_active_idx").on(table.isActive),
  ],
);

export const CreateInterviewLinkSchema = createInsertSchema(interviewLink, {
  entityType: z.enum(["gig", "vacancy", "project"]),
  entityId: z.string().uuid(),
  vacancyId: z.string().uuid().optional(),
  token: z.string().max(100),
  isActive: z.boolean().default(true),
  expiresAt: z.coerce.date().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InterviewLink = typeof interviewLink.$inferSelect;
export type NewInterviewLink = typeof interviewLink.$inferInsert;
export type InterviewLinkEntityType =
  (typeof interviewLinkEntityTypeEnum.enumValues)[number];
