import { relations } from "drizzle-orm";
import { chatMessage } from "../chat/chat-message";
import { interviewMessage } from "../interview/interview-message";
import { response } from "../response/response";
import { file } from "./file";

export const fileRelations = relations(file, ({ many }) => ({
  // Response files (universal)
  responsesAsResumePdf: many(response, {
    relationName: "response_resume_pdf_file",
  }),
  responsesAsPhoto: many(response, {
    relationName: "response_photo_file",
  }),
  responsesAsPortfolio: many(response, {
    relationName: "response_portfolio_file",
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
