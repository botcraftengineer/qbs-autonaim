import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { telegramInterviewScoring } from "../telegram/interview-scoring";
import { vacancyResponse } from "../vacancy/response";
import { conversation } from "./conversation";
import { message } from "./message";

export const conversationRelations = relations(
  conversation,
  ({ many, one }) => ({
    messages: many(message),
    interviewScoring: one(telegramInterviewScoring, {
      fields: [conversation.id],
      references: [telegramInterviewScoring.conversationId],
    }),
    response: one(vacancyResponse, {
      fields: [conversation.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);

export const messageRelations = relations(message, ({ one }) => ({
  conversation: one(conversation, {
    fields: [message.conversationId],
    references: [conversation.id],
  }),
  file: one(file, {
    fields: [message.fileId],
    references: [file.id],
    relationName: "file",
  }),
}));
