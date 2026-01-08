import { relations } from "drizzle-orm";
import { customDomain } from "..";
import { conversation } from "../conversation/conversation";
import { vacancyResponse } from "../vacancy/response";
import { vacancy } from "../vacancy/vacancy";
import { workspace } from "../workspace/workspace";
import { analyticsEvent } from "./analytics-event";
import { prequalificationSession } from "./session";
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
    response: one(vacancyResponse, {
      fields: [prequalificationSession.responseId],
      references: [vacancyResponse.id],
    }),
    conversation: one(conversation, {
      fields: [prequalificationSession.conversationId],
      references: [conversation.id],
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

// Custom Domain Relations
export const customDomainRelations = relations(customDomain, ({ one }) => ({
  workspace: one(workspace, {
    fields: [customDomain.workspaceId],
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
