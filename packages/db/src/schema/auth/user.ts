import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization } from "../organization/organization";
import { workspace } from "../workspace/workspace";

export const userRoleEnum = ["admin", "user"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const user = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  username: text("username"),
  bio: text("bio"),
  role: text("role", { enum: userRoleEnum }).default("user").notNull(),

  // Последняя активная организация и воркспейс
  lastActiveOrganizationId: text("last_active_organization_id").references(
    () => organization.id,
    { onDelete: "set null" },
  ),
  lastActiveWorkspaceId: text("last_active_workspace_id").references(
    () => workspace.id,
    { onDelete: "set null" },
  ),

  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
