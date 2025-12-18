import { relations } from "drizzle-orm";
import { conversation } from "../conversation/conversation";
import { conversationMessage } from "../conversation/message";
import { file } from "../file/file";
import { vacancyResponse } from "../vacancy/response";
import { telegramInterviewScoring } from "./interview-scoring";
import { telegramMessage } from "./message";

export const telegramConversationRelations = relations(
  conversation,
  ({ many, one }) => ({
    messages: many(telegramMessage),
    conversationMessages: many(conversationMessage),
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

export const telegramMessageRelations = relations(
  telegramMessage,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [telegramMessage.conversationId],
      references: [conversation.id],
    }),
    file: one(file, {
      fields: [telegramMessage.fileId],
      references: [file.id],
      relationName: "file",
    }),
  }),
);

export const telegramInterviewScoringRelations = relations(
  telegramInterviewScoring,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [telegramInterviewScoring.conversationId],
      references: [conversation.id],
    }),
    response: one(vacancyResponse, {
      fields: [telegramInterviewScoring.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);
