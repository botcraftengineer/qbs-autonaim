import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "./organization";
import { organizationRoleEnum } from "./organization-member";

export const organizationInvite = pgTable("organization_invites", {
  id: uuid("id").primaryKey().default(sql`uuid_generate_v7()`),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Токен для ссылки приглашения
  token: text("token").notNull().unique(),

  // Роль, которую получит пользователь при присоединении
  role: text("role", { enum: organizationRoleEnum })
    .default("member")
    .notNull(),

  // Email приглашённого (для отправки email и отображения в UI)
  invitedEmail: text("invited_email"),

  // Приглашённый пользователь (для персональных приглашений)
  invitedUserId: text("invited_user_id").references(() => user.id, {
    onDelete: "cascade",
  }),

  // Кто создал приглашение
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Дата истечения срока действия
  expiresAt: timestamp("expires_at").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type OrganizationInvite = typeof organizationInvite.$inferSelect;
export type NewOrganizationInvite = typeof organizationInvite.$inferInsert;
