import { relations } from "drizzle-orm";
import { file } from "../file";
import { response } from "../response/response";
import { workspace } from "../workspace/workspace";
import { gig } from "./gig";
import { gigInterviewMedia } from "./gig-interview-media";

export const gigRelations = relations(gig, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [gig.workspaceId],
    references: [workspace.id],
  }),
  interviewMedia: many(gigInterviewMedia),
  responses: many(response),
}));

export const gigInterviewMediaRelations = relations(
  gigInterviewMedia,
  ({ one }) => ({
    gig: one(gig, {
      fields: [gigInterviewMedia.gigId],
      references: [gig.id],
    }),
    file: one(file, {
      fields: [gigInterviewMedia.fileId],
      references: [file.id],
    }),
  }),
);
