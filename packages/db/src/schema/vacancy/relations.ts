import { relations } from "drizzle-orm";
import { telegramConversation } from "../telegram/conversation";
import { vacancyResponse } from "./response";
import { responseScreening } from "./screening";
import { vacancy } from "./vacancy";

export const vacancyRelations = relations(vacancy, ({ many }) => ({
  responses: many(vacancyResponse),
}));

export const vacancyResponseRelations = relations(
  vacancyResponse,
  ({ one }) => ({
    vacancy: one(vacancy, {
      fields: [vacancyResponse.vacancyId],
      references: [vacancy.id],
    }),
    screening: one(responseScreening, {
      fields: [vacancyResponse.id],
      references: [responseScreening.responseId],
    }),
    conversation: one(telegramConversation, {
      fields: [vacancyResponse.telegramUsername],
      references: [telegramConversation.chatId],
    }),
  }),
);
