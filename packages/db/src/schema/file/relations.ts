import { relations } from "drizzle-orm";
import { telegramMessage } from "../telegram/message";
import { vacancyResponse } from "../vacancy/response";
import { file } from "./file";

export const fileRelations = relations(file, ({ many }) => ({
  vacancyResponsesAsResumePdf: many(vacancyResponse, {
    relationName: "resumePdfFile",
  }),
  vacancyResponsesAsPhoto: many(vacancyResponse, {
    relationName: "photoFile",
  }),
  telegramMessages: many(telegramMessage),
}));
