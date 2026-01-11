import { relations } from "drizzle-orm";
import { file } from "../file";
import { response } from "../response/response";
import { interviewLink } from "./interview-link";
import { interviewMessage } from "./interview-message";
import { interviewSession } from "./interview-session";
import { interviewScoring } from "./scoring";

/**
 * Relations для interviewSession
 */
export const interviewSessionRelations = relations(
  interviewSession,
  ({ one, many }) => ({
    response: one(response, {
      fields: [interviewSession.responseId],
      references: [response.id],
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
    response: one(response, {
      fields: [interviewScoring.responseId],
      references: [response.id],
    }),
  }),
);

/**
 * Relations для interviewLink
 * Полиморфная связь через entityType + entityId
 */
export const interviewLinkRelations = relations(interviewLink, () => ({
  // Конкретные связи определяются в runtime
}));
