import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { vacancyResponse } from "../vacancy/response";
import { telegramConversation } from "./conversation";
import { telegramInterviewScoring } from "./interview-scoring";
import { telegramMessage } from "./message";

export const telegramConversationRelations = relations(
  telegramConversation,
  ({ many, one }) => ({
    messages: many(telegramMessage),
    interviewScoring: one(telegramInterviewScoring, {
      fields: [telegramConversation.id],
      references: [telegramInterviewScoring.conversationId],
    }),
    response: one(vacancyResponse, {
      fields: [telegramConversation.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);

export const telegramMessageRelations = relations(
  telegramMessage,
  ({ one }) => ({
    conversation: one(telegramConversation, {
      fields: [telegramMessage.conversationId],
      references: [telegramConversation.id],
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
    conversation: one(telegramConversation, {
      fields: [telegramInterviewScoring.conversationId],
      references: [telegramConversation.id],
    }),
    response: one(vacancyResponse, {
      fields: [telegramInterviewScoring.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);
