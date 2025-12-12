/**
 * Утилиты для обработки FLOOD_WAIT ошибок от Telegram API
 */

/**
 * Вспомогательная функция для задержки
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Проверяет, является ли ошибка FLOOD_WAIT
 */
export function isFloodWaitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (
    "code" in error &&
    error.code === 420 &&
    "text" in error &&
    typeof error.text === "string" &&
    error.text.includes("FLOOD_WAIT")
  );
}

/**
 * Извлекает количество секунд ожидания из FLOOD_WAIT ошибки
 */
export function getFloodWaitSeconds(error: unknown): number {
  if (!error || typeof error !== "object") return 30;
  if ("seconds" in error && typeof error.seconds === "number") {
    return error.seconds;
  }
  if ("text" in error && typeof error.text === "string") {
    const match = error.text.match(/FLOOD_WAIT_(\d+)/);
    if (match?.[1]) {
      return Number.parseInt(match[1], 10);
    }
  }
  return 30; // По умолчанию 30 секунд
}

/**
 * Выполняет функцию с автоматической обработкой FLOOD_WAIT
 * @param fn Функция для выполнения
 * @param maxRetries Максимальное количество повторных попыток
 * @returns Результат выполнения функции
 */
export async function withFloodWaitRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  const normalizedRetries = Math.max(0, Math.floor(maxRetries));
  let lastError: unknown;

  for (let attempt = 0; attempt <= normalizedRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (isFloodWaitError(error)) {
        if (attempt < normalizedRetries) {
          const waitSeconds = getFloodWaitSeconds(error);
          console.warn(
            `⏳ FLOOD_WAIT: ожидание ${waitSeconds} секунд (попытка ${attempt + 1}/${normalizedRetries})...`,
          );
          await sleep(waitSeconds * 1000);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
