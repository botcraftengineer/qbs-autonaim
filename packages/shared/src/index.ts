/**
 * Главный экспорт пакета @qbs-autonaim/shared
 *
 * Предоставляет общие типы и утилиты для использования
 * в пакетах @qbs-autonaim/jobs и @qbs-autonaim/tg-client
 */

// Экспорт ranking service
export * from "./ranking-service";
// Экспорт всех типов
export type {
  BufferedMessage,
  BufferValue,
  ConversationMetadata,
  MessageBufferService,
  QuestionAnswer,
} from "./types";

// Экспорт всех утилит
export {
  getConversationMetadata,
  getInterviewBaseUrl,
  getInterviewUrl,
  getInterviewUrlFromDb,
  getQuestionCount,
  updateConversationMetadata,
} from "./utils";
