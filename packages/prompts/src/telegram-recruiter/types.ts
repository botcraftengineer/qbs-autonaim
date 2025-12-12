/**
 * Типы для промптов Telegram-бота рекрутера
 */

export type ConversationStage =
  | "AWAITING_PIN" // Ждем PIN-код от кандидата
  | "INVALID_PIN" // Неверный PIN-код
  | "PIN_RECEIVED" // PIN получен, начинаем интервью
  | "INTERVIEWING"; // Проводим интервью

export interface TelegramRecruiterContext {
  messageText: string;
  stage: ConversationStage;
  candidateName?: string; // Полное ФИО кандидата (НЕ используется в промптах - только для логирования)
  vacancyTitle?: string;
  vacancyRequirements?: string; // Требования к вакансии
  responseStatus?: string;
  conversationHistory?: Array<{
    sender: string;
    content: string;
    contentType?: "TEXT" | "VOICE";
  }>;
  resumeData?: {
    experience?: string;
    coverLetter?: string;
    phone?: string;
  };
  errorMessage?: string;
  customBotInstructions?: string | null; // Кастомные инструкции для бота
  customInterviewQuestions?: string | null; // Кастомные вопросы для интервью
}
