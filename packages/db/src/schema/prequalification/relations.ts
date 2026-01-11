import { relations } from "drizzle-orm";
import { chatSession } from "../chat/chat-session";
import { interviewSession } from "../interview/interview-session";
import { response } from "../response/response";
import { vacancy } from "../vacancy/vacancy";
import { workspace } from "../workspace/workspace";
import { analyticsEvent } from "./analytics-event";
import { prequalificationSession } from "./prequalification-session";
import { widgetConfig } from "./widget-config";

// Prequalification Session Relations
export const prequalificationSessionRelations = relations(
  prequalificationSession,
  ({ one, many }) => ({
    workspace: one(workspace, {
      fields: [prequalificationSession.workspaceId],
      references: [workspace.id],
    }),
    vacancy: one(vacancy, {
      fields: [prequalificationSession.vacancyId],
      references: [vacancy.id],
    }),
    response: one(response, {
      fields: [prequalificationSession.responseId],
      references: [response.id],
    }),
    chatSession: one(chatSession, {
      fields: [prequalificationSession.chatSessionId],
      references: [chatSession.id],
    }),
    interviewSession: one(interviewSession, {
      fields: [prequalificationSession.interviewSessionId],
      references: [interviewSession.id],
    }),
    analyticsEvents: many(analyticsEvent),
  }),
);

// Widget Config Relations
export const widgetConfigRelations = relations(widgetConfig, ({ one }) => ({
  workspace: one(workspace, {
    fields: [widgetConfig.workspaceId],
    references: [workspace.id],
  }),
}));

// Analytics Event Relations
export const analyticsEventRelations = relations(analyticsEvent, ({ one }) => ({
  workspace: one(workspace, {
    fields: [analyticsEvent.workspaceId],
    references: [workspace.id],
  }),
  vacancy: one(vacancy, {
    fields: [analyticsEvent.vacancyId],
    references: [vacancy.id],
  }),
  session: one(prequalificationSession, {
    fields: [analyticsEvent.sessionId],
    references: [prequalificationSession.id],
  }),
}));
