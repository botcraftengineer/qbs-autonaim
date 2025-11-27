import { relations } from "drizzle-orm";
import { file } from "../file/file";
import { telegramConversation } from "./conversation";
import { telegramMessage } from "./message";

export const telegramConversationRelations = relations(
  telegramConversation,
  ({ many }) => ({
    messages: many(telegramMessage),
  })
);

export const telegramMessageRelations = relations(
  telegramMessage,
  ({ one }) => ({
    conversation: one(telegramConversation, {
      fields: [telegramMessage.conversationId],
      references: [telegramConversation.id],
    }),
    file: one(file, {
      fields: [telegramMessage.fileId],
      references: [file.id],
    }),
  })
);
