import { relations } from "drizzle-orm";
import { file } from "../file";
import { workspace } from "../workspace/workspace";
import { gig } from "./gig";
import { gigInterviewLink } from "./interview-link";
import { gigInvitation } from "./invitation";
import { gigResponse } from "./response";
import { gigResponseScreening } from "./screening";

export const gigRelations = relations(gig, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [gig.workspaceId],
    references: [workspace.id],
  }),
  responses: many(gigResponse),
  interviewLinks: many(gigInterviewLink),
}));

export const gigInterviewLinkRelations = relations(
  gigInterviewLink,
  ({ one }) => ({
    gig: one(gig, {
      fields: [gigInterviewLink.gigId],
      references: [gig.id],
    }),
  }),
);

export const gigInvitationRelations = relations(gigInvitation, ({ one }) => ({
  response: one(gigResponse, {
    fields: [gigInvitation.responseId],
    references: [gigResponse.id],
  }),
}));

export const gigResponseRelations = relations(gigResponse, ({ one }) => ({
  gig: one(gig, {
    fields: [gigResponse.gigId],
    references: [gig.id],
  }),
  screening: one(gigResponseScreening, {
    fields: [gigResponse.id],
    references: [gigResponseScreening.responseId],
  }),
  portfolioFile: one(file, {
    fields: [gigResponse.portfolioFileId],
    references: [file.id],
    relationName: "portfolioFile",
  }),
  photoFile: one(file, {
    fields: [gigResponse.photoFileId],
    references: [file.id],
    relationName: "photoFile",
  }),
}));
