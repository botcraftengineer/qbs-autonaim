// Реэкспорт из chat схемы для обратной совместимости
export {
  chatMessage as conversationMessage,
  chatMessageRoleEnum as messageSenderEnum,
  chatMessageTypeEnum as messageContentTypeEnum,
} from "../chat/session";
