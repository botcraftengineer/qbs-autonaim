import { relations } from "drizzle-orm";
import { conversationMessage } from "../conversation/message";
import { vacancyResponse } from "../vacancy/response";
import { file } from "./file";

export const fileRelations = relations(file, ({ many }) => ({
  vacancyResponsesAsResumePdf: many(vacancyResponse, {
    relationName: "resumePdfFile",
  }),
  vacancyResponsesAsPhoto: many(vacancyResponse, {
    relationName: "photoFile",
  }),
  conversationMessages: many(conversationMessage, {
    relationName: "file",
  }),
}));
