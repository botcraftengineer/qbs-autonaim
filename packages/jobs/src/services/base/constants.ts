/**
 * Общие константы для сервисов
 *
 * Примечание: Для RESPONSE_STATUS используйте константы из @selectio/db/schema,
 * так как они определяют фактические значения базы данных.
 */

export const INTERVIEW = {
  /** Максимальное количество вопросов в интервью */
  MAX_QUESTIONS: 4,
  /** Резервная оценка по умолчанию (шкала 1-5) */
  DEFAULT_FALLBACK_SCORE: 3,
  /** Резервная детальная оценка по умолчанию (шкала 0-100) */
  DEFAULT_FALLBACK_DETAILED_SCORE: 50,
  /** Резервный вопрос по умолчанию при сбое парсинга AI */
  DEFAULT_FALLBACK_QUESTION: "Расскажи подробнее о своем опыте",
} as const;

export const SCREENING = {
  /** Минимальная оценка (шкала 0-100) */
  MIN_SCORE: 0,
  /** Максимальная оценка (шкала 0-100) */
  MAX_SCORE: 100,
  /** Минимальная простая оценка (шкала 1-5) */
  MIN_SIMPLE_SCORE: 1,
  /** Максимальная простая оценка (шкала 1-5) */
  MAX_SIMPLE_SCORE: 5,
} as const;

export const AI = {
  /** Температура для детерминированных ответов */
  TEMPERATURE_DETERMINISTIC: 0,
  /** Температура для низкой креативности */
  TEMPERATURE_LOW: 0.1,
  /** Температура для умеренной креативности */
  TEMPERATURE_MODERATE: 0.3,
  /** Температура для повышенной креативности (приветственные сообщения, вопросы) */
  TEMPERATURE_CREATIVE: 0.7,
  /** Температура для очень креативных ответов */
  TEMPERATURE_HIGH: 0.8,
} as const;

export const TELEGRAM = {
  /** Минимальная длина имени пользователя */
  MIN_USERNAME_LENGTH: 5,
  /** Шаблон регулярного выражения для имени пользователя */
  USERNAME_PATTERN: /^[a-zA-Z0-9_]{5,}$/,
} as const;

export type { ResponseStatus } from "@selectio/db/schema";
// Re-export RESPONSE_STATUS from database schema for consistency
export { RESPONSE_STATUS } from "@selectio/db/schema";
