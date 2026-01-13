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
  identifiedBy?: "pin_code" | "vacancy_search" | "username" | "phone" | "none";

  /** PIN-код для идентификации */
  pinCode?: string;

  /** Username для идентификации */
  username?: string;

  /** Телефон для идентификации */
  phone?: string;

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

  /** Внутренние заметки/сигналы по интервью (не показывать кандидату) */
  interviewNotes?: Array<{
    type: "note" | "signal";
    content: string;
    tag?: string;
    timestamp: string;
  }>;

  /** Снапшот рубрики оценки, использованной в интервью (для воспроизводимости) */
  interviewRubric?: {
    version?: string;
    entityType?: "gig" | "vacancy" | "unknown";
    criteria: Array<{
      key: string;
      title: string;
      description: string;
      weight: number;
    }>;
  };

  interviewState?: {
    version?: string;
    stage?: "intro" | "org" | "tech" | "wrapup";
    askedQuestions?: string[];
    voiceOptionOffered?: boolean;
    updatedAt?: string;
  };

  interviewQuestionBank?: {
    entityType?: "gig" | "vacancy" | "unknown";
    signature?: string;
    organizational?: string[];
    technical?: string[];
    updatedAt?: string;
  };
}
