/**
 * Типы для системы скрининга резюме
 */

/**
 * Рекомендация по результатам скрининга
 */
export type ScreeningRecommendation = "invite" | "reject" | "need_info";

/**
 * Результат скрининга резюме
 */
export interface ScreeningResult {
  /** Процент соответствия резюме вакансии (0-100) */
  match_percentage: number;

  /** Рекомендация: пригласить, отклонить или нужна доп. информация */
  recommendation: ScreeningRecommendation;

  /** Сильные стороны кандидата */
  strengths: string[];

  /** Слабые стороны или недостающие навыки */
  weaknesses: string[];

  /** Краткое резюме оценки */
  summary: string;
}

/**
 * Данные для генерации промпта
 */
export interface ScreeningPromptData {
  /** ID вакансии */
  vacancyId: string;

  /** Название вакансии */
  title: string;

  /** Описание вакансии */
  description: string;
}

/**
 * Данные резюме для скрининга
 */
export interface ResumeScreeningData {
  /** Опыт работы */
  experience: string;

  /** Образование */
  education?: string;

  /** Навыки */
  skills?: string;

  /** О себе */
  about?: string;

  /** Языки */
  languages?: string;

  /** Курсы и сертификаты */
  courses?: string;
}
