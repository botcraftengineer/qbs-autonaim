import { relations } from "drizzle-orm";
import { workspace } from "../workspace/workspace";
import { botSettings } from "./bot-settings";

export const botSettingsRelations = relations(botSettings, ({ one }) => ({
  workspace: one(workspace, {
    fields: [botSettings.workspaceId],
    references: [workspace.id],
  }),
}));
