import { relations } from "drizzle-orm";
import { file } from "../file";
import { organization } from "../organization/organization";
import { response } from "../response/response";
import { candidate } from "./candidate";

export const candidateRelations = relations(candidate, ({ one, many }) => ({
  organization: one(organization, {
    fields: [candidate.organizationId],
    references: [organization.id],
  }),
  photoFile: one(file, {
    fields: [candidate.photoFileId],
    references: [file.id],
  }),
  responses: many(response),
}));
