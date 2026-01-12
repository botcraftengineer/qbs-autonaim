import { relations } from "drizzle-orm";
import { user } from "../auth";
import { response } from "../response/response";
import { workspace } from "../workspace/workspace";
import { freelanceImportHistory } from "./freelance-import-history";
import { vacancy } from "./vacancy";

export const vacancyRelations = relations(vacancy, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [vacancy.workspaceId],
    references: [workspace.id],
  }),
  responses: many(response),
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
