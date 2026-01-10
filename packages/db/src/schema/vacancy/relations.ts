import { relations } from "drizzle-orm";
import { chatSession } from "../chat/session";
import { file } from "../file";
import { interviewScoring } from "../interview/scoring";
import { workspace } from "../workspace/workspace";
import { vacancyResponse } from "./response";
import { vacancyResponseHistory } from "./response-history";
import { vacancyResponseScreening } from "./screening";
import { vacancy } from "./vacancy";

export const vacancyRelations = relations(vacancy, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [vacancy.workspaceId],
    references: [workspace.id],
  }),
  responses: many(vacancyResponse),
}));

export const vacancyResponseRelations = relations(
  vacancyResponse,
  ({ one, many }) => ({
    vacancy: one(vacancy, {
      fields: [vacancyResponse.vacancyId],
      references: [vacancy.id],
    }),
    screening: one(vacancyResponseScreening, {
      fields: [vacancyResponse.id],
      references: [vacancyResponseScreening.responseId],
    }),
    // Используем chatSession вместо удалённого telegramConversation
    chatSession: one(chatSession, {
      fields: [vacancyResponse.id],
      references: [chatSession.entityId],
    }),
    resumePdfFile: one(file, {
      fields: [vacancyResponse.resumePdfFileId],
      references: [file.id],
      relationName: "resumePdfFile",
    }),
    photoFile: one(file, {
      fields: [vacancyResponse.photoFileId],
      references: [file.id],
      relationName: "photoFile",
    }),
    interviewScoring: one(interviewScoring, {
      fields: [vacancyResponse.id],
      references: [interviewScoring.responseId],
    }),
    history: many(vacancyResponseHistory),
  }),
);
