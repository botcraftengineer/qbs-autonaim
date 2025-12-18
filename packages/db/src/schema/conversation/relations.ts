import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { telegramInterviewScoring } from "../telegram/interview-scoring";
import { telegramMessage } from "../telegram/message";
import { vacancyResponse } from "../vacancy/response";
import { conversation } from "./conversation";
import { conversationMessage } from "./message";

export const conversationRelations = relations(
  conversation,
  ({ many, one }) => ({
    messages: many(conversationMessage),
    telegramMessages: many(telegramMessage),
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

export const conversationMessageRelations = relations(
  conversationMessage,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [conversationMessage.conversationId],
      references: [conversation.id],
    }),
    file: one(file, {
      fields: [conversationMessage.fileId],
      references: [file.id],
      relationName: "file",
    }),
  }),
);
