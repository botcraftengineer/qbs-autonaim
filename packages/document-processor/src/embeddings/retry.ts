import { DocumentProcessingError, DocumentProcessingErrorCode } from "../types";

/**
 * Configuration for retry logic
 */
export interface RetryConfig {
  /** Максимальное количество попыток */
  maxRetries: number;
  /** Начальная задержка в миллисекундах */
  initialDelay: number;
  /** Множитель для exponential backoff */
  backoffMultiplier: number;
  /** Максимальная задержка в миллисекундах */
  maxDelay: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  backoffMultiplier: 2,
  maxDelay: 30000, // 30 seconds
};

/**
 * Проверяет, является ли ошибка retriable
 */
function isRetriableError(error: unknown): boolean {
  // Проверяем на rate limiting
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("rate limit") ||
      message.includes("too many requests") ||
      message.includes("429")
    ) {
      return true;
    }
  }

  // Проверяем на временные сетевые ошибки
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes("timeout") ||
      message.includes("econnreset") ||
      message.includes("econnrefused") ||
      message.includes("network")
    ) {
      return true;
    }
  }

  // Проверяем на DocumentProcessingError с кодом PROVIDER_UNAVAILABLE или RATE_LIMITED
  if (error instanceof DocumentProcessingError) {
    return (
      error.code === DocumentProcessingErrorCode.PROVIDER_UNAVAILABLE ||
      error.code === DocumentProcessingErrorCode.RATE_LIMITED
    );
  }

  return false;
}

/**
 * Вычисляет задержку для следующей попытки с exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelay * config.backoffMultiplier ** attempt;
  return Math.min(delay, config.maxDelay);
}

/**
 * Выполняет функцию с retry логикой и exponential backoff
 * @param fn - Функция для выполнения
 * @param config - Конфигурация retry
 * @returns Результат выполнения функции
 * @throws Последняя ошибка после исчерпания попыток
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Если это последняя попытка или ошибка не retriable, выбрасываем
      if (attempt === config.maxRetries || !isRetriableError(error)) {
        throw error;
      }

      // Вычисляем задержку и ждём
      const delay = calculateDelay(attempt, config);
      console.warn(
        `Retry attempt ${attempt + 1}/${config.maxRetries} after ${delay}ms`,
        { error: error instanceof Error ? error.message : String(error) },
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Этот код не должен выполниться, но TypeScript требует return
  throw lastError;
}
