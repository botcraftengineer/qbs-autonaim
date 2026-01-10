import { relations } from "drizzle-orm";
import { file } from "../file";
import { interviewLink } from "./interview-link";
import { responseInvitation } from "./invitation";
import { response } from "./response";
import { responseScreening } from "./screening";

export const responseRelations = relations(response, ({ one, many }) => ({
  portfolioFile: one(file, {
    fields: [response.portfolioFileId],
    references: [file.id],
    relationName: "response_portfolio_file",
  }),
  photoFile: one(file, {
    fields: [response.photoFileId],
    references: [file.id],
    relationName: "response_photo_file",
  }),
  resumePdfFile: one(file, {
    fields: [response.resumePdfFileId],
    references: [file.id],
    relationName: "response_resume_pdf_file",
  }),
  screening: one(responseScreening, {
    fields: [response.id],
    references: [responseScreening.responseId],
  }),
  invitations: many(responseInvitation),
}));

export const responseScreeningRelations = relations(
  responseScreening,
  ({ one }) => ({
    response: one(response, {
      fields: [responseScreening.responseId],
      references: [response.id],
    }),
  }),
);

export const responseInvitationRelations = relations(
  responseInvitation,
  ({ one }) => ({
    response: one(response, {
      fields: [responseInvitation.responseId],
      references: [response.id],
    }),
  }),
);

export const interviewLinkRelations = relations(interviewLink, ({ one }) => ({
  // Связь через entityId будет определяться в runtime
}));
