// Реэкспорт из новой схемы для обратной совместимости
export {
  CreateMessageSchema as CreateTelegramMessageSchema,
  message as telegramMessage,
  messageContentTypeEnum,
  messageSenderEnum,
} from "../conversation/message";
