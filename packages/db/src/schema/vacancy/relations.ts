import { relations } from "drizzle-orm";
import { user } from "../auth";
import { workspace } from "../workspace/workspace";
import { freelanceImportHistory } from "./freelance-import-history";
import { vacancy } from "./vacancy";

export const vacancyRelations = relations(vacancy, ({ one }) => ({
  workspace: one(workspace, {
    fields: [vacancy.workspaceId],
    references: [workspace.id],
  }),
}));

export const freelanceImportHistoryRelations = relations(
  freelanceImportHistory,
  ({ one }) => ({
    vacancy: one(vacancy, {
      fields: [freelanceImportHistory.vacancyId],
      references: [vacancy.id],
    }),
    importedByUser: one(user, {
      fields: [freelanceImportHistory.importedBy],
      references: [user.id],
    }),
  }),
);
