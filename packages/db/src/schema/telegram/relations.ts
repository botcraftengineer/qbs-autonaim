import { relations } from "drizzle-orm";
import { conversation } from "../conversation/conversation";
import { conversationMessage } from "../conversation/message";
import { file } from "../file/file";
import { interviewScoring } from "../interview/scoring";
import { vacancyResponse } from "../vacancy/response";

// Реэкспорт relations из conversation для обратной совместимости
export const telegramConversationRelations = relations(
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
