import { relations } from "drizzle-orm";
import { chatMessage, chatSession } from "../chat/session";
import { file } from "../file/file";
import { workspace } from "../workspace/workspace";
import { telegramSession } from "./session";

/**
 * Relations для telegram сессий
 */
export const telegramSessionRelations = relations(
  telegramSession,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [telegramSession.workspaceId],
      references: [workspace.id],
    }),
  }),
);

/**
 * Relations для chat сообщений с файлами
 */
export const chatMessageFileRelations = relations(chatMessage, ({ one }) => ({
  file: one(file, {
    fields: [chatMessage.fileId],
    references: [file.id],
    relationName: "file",
  }),
  session: one(chatSession, {
    fields: [chatMessage.sessionId],
    references: [chatSession.id],
  }),
}));
