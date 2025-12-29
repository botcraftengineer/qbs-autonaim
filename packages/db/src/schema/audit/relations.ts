import { relations } from "drizzle-orm";
import { user } from "../auth";
import { auditLog } from "./audit-log";

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(user, {
    fields: [auditLog.userId],
    references: [user.id],
  }),
}));
