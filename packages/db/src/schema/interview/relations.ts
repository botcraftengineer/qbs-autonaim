import { relations } from "drizzle-orm";
import { file } from "../file";
import { gigResponse } from "../gig/response";
import { vacancyResponse } from "../vacancy/response";
import { interviewScoring } from "./scoring";
import { interviewMessage, interviewSession } from "./session";

/**
 * Relations для interviewSession
 */
export const interviewSessionRelations = relations(
  interviewSession,
  ({ one, many }) => ({
    vacancyResponse: one(vacancyResponse, {
      fields: [interviewSession.vacancyResponseId],
      references: [vacancyResponse.id],
    }),
    gigResponse: one(gigResponse, {
      fields: [interviewSession.gigResponseId],
      references: [gigResponse.id],
    }),
    messages: many(interviewMessage),
    scoring: one(interviewScoring, {
      fields: [interviewSession.id],
      references: [interviewScoring.interviewSessionId],
    }),
  }),
);

/**
 * Relations для interviewMessage
 */
export const interviewMessageRelations = relations(
  interviewMessage,
  ({ one }) => ({
    session: one(interviewSession, {
      fields: [interviewMessage.sessionId],
      references: [interviewSession.id],
    }),
    file: one(file, {
      fields: [interviewMessage.fileId],
      references: [file.id],
      relationName: "file",
    }),
  }),
);

/**
 * Relations для interviewScoring
 */
export const interviewScoringRelations = relations(
  interviewScoring,
  ({ one }) => ({
    interviewSession: one(interviewSession, {
      fields: [interviewScoring.interviewSessionId],
      references: [interviewSession.id],
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
