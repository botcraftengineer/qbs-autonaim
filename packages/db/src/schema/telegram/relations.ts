import { relations } from "drizzle-orm";
import { workspace } from "../workspace/workspace";
import { telegramSession } from "./telegram-session";

/**
 * Relations для telegram сессий
 */
export const telegramSessionRelations = relations(
  telegramSession,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [telegramSession.workspaceId],
      references: [workspace.id],
    }),
  }),
);
