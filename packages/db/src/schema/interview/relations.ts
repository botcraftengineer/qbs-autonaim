import { relations } from "drizzle-orm";
import { conversation } from "../conversation/conversation";
import { vacancyResponse } from "../vacancy/response";
import { interviewScoring } from "./scoring";

export const interviewScoringRelations = relations(
  interviewScoring,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [interviewScoring.conversationId],
      references: [conversation.id],
    }),
    response: one(vacancyResponse, {
      fields: [interviewScoring.responseId],
      references: [vacancyResponse.id],
    }),
  }),
);
