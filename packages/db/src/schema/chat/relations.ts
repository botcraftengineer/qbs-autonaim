import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { chatMessage } from "./chat-message";
import { chatSession } from "./chat-session";

export const chatSessionRelations = relations(chatSession, ({ many }) => ({
  messages: many(chatMessage),
}));

export const chatMessageRelations = relations(chatMessage, ({ one }) => ({
  session: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
  file: one(file, {
    fields: [chatMessage.fileId],
    references: [file.id],
  }),
}));
