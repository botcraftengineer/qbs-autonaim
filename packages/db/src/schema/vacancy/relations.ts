import { relations } from "drizzle-orm";
import { file } from "../file";
import { telegramConversation } from "../telegram/conversation";
import { telegramInterviewScoring } from "../telegram/interview-scoring";
import { workspace } from "../workspace/workspace";
import { vacancyResponse } from "./response";
import { vacancyResponseHistory } from "./response-history";
import { responseScreening } from "./screening";
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
    screening: one(responseScreening, {
      fields: [vacancyResponse.id],
      references: [responseScreening.responseId],
    }),
    conversation: one(telegramConversation, {
      fields: [vacancyResponse.id],
      references: [telegramConversation.responseId],
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
    telegramInterviewScoring: one(telegramInterviewScoring, {
      fields: [vacancyResponse.id],
      references: [telegramInterviewScoring.responseId],
    }),
    history: many(vacancyResponseHistory),
  }),
);
