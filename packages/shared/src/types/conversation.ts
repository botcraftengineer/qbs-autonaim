/**
 * Типы для работы с метаданными conversation
 */

/**
 * Представляет пару вопрос-ответ в интервью
 */
export interface QuestionAnswer {
  /** Текст вопроса */
  question: string;
  
  /** Ответ кандидата */
  answer: string;
  
  /** Временная метка (ISO string) */
  timestamp?: string;
}

/**
 * Метаданные conversation
 * 
 * Хранит состояние и контекст разговора с кандидатом
 */
export interface ConversationMetadata {
  /** Способ идентификации кандидата */
  identifiedBy?: "pin_code" | "vacancy_search" | "username" | "none";
  
  /** PIN-код для идентификации */
  pinCode?: string;
  
  /** Поисковый запрос по вакансии */
  searchQuery?: string;
  
  /** Ожидается ли ввод PIN-кода */
  awaitingPin?: boolean;
  
  /** Началось ли интервью */
  interviewStarted?: boolean;
  
  /** История вопросов и ответов */
  questionAnswers?: QuestionAnswer[];
  
  /** Последний заданный вопрос */
  lastQuestionAsked?: string;
  
  /** Завершено ли интервью */
  interviewCompleted?: boolean;
  
  /** Время завершения интервью (ISO string) */
  completedAt?: string;
}
