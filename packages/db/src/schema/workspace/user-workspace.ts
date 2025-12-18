import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../auth/user";
import { workspace } from "./workspace";

export const userWorkspaceRoleEnum = ["owner", "admin", "member"] as const;
export type UserWorkspaceRole = (typeof userWorkspaceRoleEnum)[number];

export const userWorkspace = pgTable(
  "workspace_members",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),

    // Роль пользователя в workspace
    role: text("role", { enum: userWorkspaceRoleEnum })
      .default("member")
      .notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.workspaceId] }),
  }),
);

export type UserWorkspace = typeof userWorkspace.$inferSelect;
export type NewUserWorkspace = typeof userWorkspace.$inferInsert;
