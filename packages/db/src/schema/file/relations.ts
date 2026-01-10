import { relations } from "drizzle-orm";
import { chatMessage } from "../chat/session";
import { gigResponse } from "../gig/response";
import { interviewMessage } from "../interview/session";
import { vacancyResponse } from "../vacancy/response";
import { file } from "./file";

export const fileRelations = relations(file, ({ many }) => ({
  // Vacancy response files
  vacancyResponsesAsResumePdf: many(vacancyResponse, {
    relationName: "resumePdfFile",
  }),
  vacancyResponsesAsPhoto: many(vacancyResponse, {
    relationName: "photoFile",
  }),
  // Gig response files
  gigResponsesAsPortfolio: many(gigResponse, {
    relationName: "portfolioFile",
  }),
  gigResponsesAsPhoto: many(gigResponse, {
    relationName: "photoFile",
  }),
  // Chat messages with files (admin chats)
  chatMessages: many(chatMessage, {
    relationName: "file",
  }),
  // Interview messages with files (candidate interviews)
  interviewMessages: many(interviewMessage, {
    relationName: "file",
  }),
}));
