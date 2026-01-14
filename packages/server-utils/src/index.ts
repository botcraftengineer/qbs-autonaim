/**
 * Серверные утилиты @qbs-autonaim/server-utils
 * Этот пакет содержит функции, которые работают только на сервере и используют БД
 */

// Маркер server-only для предотвращения попадания в браузер
import "server-only";

// Экспорты conversation утилит
export {
  ConversationMetadataSchema,
  getChatSessionMetadata,
  getConversationMetadata,
  getInterviewQuestionCount,
  getInterviewSessionMetadata,
  getQuestionCount,
  updateChatSessionMetadata,
  updateConversationMetadata,
  updateInterviewSessionMetadata,
} from "./conversation";

// Экспорты interview URL утилит
export {
  getInterviewBaseUrl,
  getInterviewUrl,
  getInterviewUrlFromDb,
  getInterviewUrlFromEntity,
} from "./get-interview-url";