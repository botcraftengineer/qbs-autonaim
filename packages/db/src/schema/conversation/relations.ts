import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { interviewScoring } from "../interview/scoring";
import { vacancyResponse } from "../vacancy/response";
import { conversation } from "./conversation";
import { conversationMessage } from "./message";

export const conversationRelations = relations(
  conversation,
  ({ many, one }) => ({
    messages: many(conversationMessage),
    interviewScoring: one(interviewScoring, {
      fields: [conversation.id],
      references: [interviewScoring.conversationId],
    }),
    response: one(vacancyResponse, {
      fields: [conversation.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);

export const messageRelations = relations(conversationMessage, ({ one }) => ({
  conversation: one(conversation, {
    fields: [conversationMessage.conversationId],
    references: [conversation.id],
  }),
  file: one(file, {
    fields: [conversationMessage.fileId],
    references: [file.id],
    relationName: "file",
  }),
}));
