import { relations } from "drizzle-orm";
import { user } from "../auth/user";
import { companySettings } from "../company/company-settings";
import { customDomain } from "../custom-domain/custom-domain";
import { integration } from "../integration/integration";
import { organization } from "../organization/organization";
import { vacancy } from "../vacancy/vacancy";
import { workspace } from "./workspace";
import { workspaceInvite } from "./workspace-invite";
import { workspaceMember } from "./workspace-member";

export const workspaceRelations = relations(workspace, ({ many, one }) => ({
  organization: one(organization, {
    fields: [workspace.organizationId],
    references: [organization.id],
  }),
  members: many(workspaceMember),
  integrations: many(integration),
  vacancies: many(vacancy),
  invites: many(workspaceInvite),
  customDomains: many(customDomain),
  companySettings: one(companySettings, {
    fields: [workspace.id],
    references: [companySettings.workspaceId],
  }),
}));

export const workspaceInviteRelations = relations(
  workspaceInvite,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [workspaceInvite.workspaceId],
      references: [workspace.id],
    }),
  }),
);

export const workspaceMemberRelations = relations(
  workspaceMember,
  ({ one }) => ({
    user: one(user, {
      fields: [workspaceMember.userId],
      references: [user.id],
    }),
    workspace: one(workspace, {
      fields: [workspaceMember.workspaceId],
      references: [workspace.id],
    }),
  }),
);

export const workspaceCustomDomainRelations = relations(
  customDomain,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [customDomain.workspaceId],
      references: [workspace.id],
    }),
  }),
);

export const userRelations = relations(user, ({ many }) => ({
  workspaceMembers: many(workspaceMember),
}));
