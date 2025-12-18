import { relations } from "drizzle-orm";
import { conversation } from "../conversation/conversation";
import { message } from "../conversation/message";
import { file } from "../file/file";
import { vacancyResponse } from "../vacancy/response";
import { telegramInterviewScoring } from "./interview-scoring";

// Реэкспорт relations из conversation для обратной совместимости
export const telegramConversationRelations = relations(
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

export const telegramMessageRelations = relations(message, ({ one }) => ({
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
