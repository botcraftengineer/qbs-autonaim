// Реэкспорт из новой схемы для обратной совместимости
export {
  CreateMessageSchema as CreateTelegramMessageSchema,
  conversationMessage,
  messageContentTypeEnum,
  messageSenderEnum,
} from "../conversation/message";
