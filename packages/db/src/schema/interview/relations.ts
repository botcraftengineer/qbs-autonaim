import { relations } from "drizzle-orm";
import { chatSession } from "../chat/session";
import { gigResponse } from "../gig/response";
import { vacancyResponse } from "../vacancy/response";
import { interviewScoring } from "./scoring";

export const interviewScoringRelations = relations(
  interviewScoring,
  ({ one }) => ({
    chatSession: one(chatSession, {
      fields: [interviewScoring.chatSessionId],
      references: [chatSession.id],
    }),
    response: one(vacancyResponse, {
      fields: [interviewScoring.responseId],
      references: [vacancyResponse.id],
    }),
    gigResponse: one(gigResponse, {
      fields: [interviewScoring.gigResponseId],
      references: [gigResponse.id],
    }),
  }),
);
