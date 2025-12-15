/**
 * Конфигурация мультиагентной системы
 */

export const AGENT_CONFIG = {
  // Лимиты
  MAX_STEPS: 20,
  MAX_VOICE_MESSAGES: 2,
  MAX_QUESTIONS: 4,
  MAX_HISTORY_MESSAGES: 10,

  // Пороги для эскалации
  ESCALATION_THRESHOLDS: {
    FAILED_PIN_ATTEMPTS: 3,
    CONVERSATION_LENGTH: 50,
    NEGATIVE_SENTIMENT_THRESHOLD: 0.7,
  },

  // Настройки AI
  AI_SETTINGS: {
    MAX_TOKENS: 2000,
    TEMPERATURE: 0.7,
    TOP_P: 0.9,
  },

  // Таймауты
  TIMEOUTS: {
    AGENT_EXECUTION: 30000, // 30 секунд
    AI_GENERATION: 20000, // 20 секунд
  },

  // Фичи
  FEATURES: {
    USE_MULTI_AGENT_SYSTEM: true, // Мультиагентная система включена по умолчанию
    ENABLE_AGENT_TRACING: true,
    ENABLE_SENTIMENT_ANALYSIS: true,
    ENABLE_TOPIC_EXTRACTION: true,
  },
} as const;

/**
 * Получение конфигурации из переменных окружения
 */
export function getAgentConfig() {
  return {
    ...AGENT_CONFIG,
    FEATURES: {
      ...AGENT_CONFIG.FEATURES,
      USE_MULTI_AGENT_SYSTEM:
        process.env.USE_MULTI_AGENT_SYSTEM === "true" ||
        AGENT_CONFIG.FEATURES.USE_MULTI_AGENT_SYSTEM,
    },
  };
}
