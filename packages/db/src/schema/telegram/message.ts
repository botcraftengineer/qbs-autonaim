// Реэкспорт из новой схемы для обратной совместимости
export {
  CreateMessageSchema as CreateTelegramMessageSchema,
  conversationMessage as telegramMessage,
  messageContentTypeEnum,
  messageSenderEnum,
} from "../conversation/message";
