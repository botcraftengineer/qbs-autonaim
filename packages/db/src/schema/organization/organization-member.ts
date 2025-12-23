import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { organization } from "./organization";

export const organizationRoleEnum = ["owner", "admin", "member"] as const;
export type OrganizationRole = (typeof organizationRoleEnum)[number];

export const organizationMember = pgTable(
  "organization_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Роль пользователя в организации
    role: text("role", { enum: organizationRoleEnum })
      .default("member")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.organizationId] }),
  }),
);

export type OrganizationMember = typeof organizationMember.$inferSelect;
export type NewOrganizationMember = typeof organizationMember.$inferInsert;
