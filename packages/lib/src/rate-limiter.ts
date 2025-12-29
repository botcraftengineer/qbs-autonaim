/**
 * Rate Limiter - ограничение частоты запросов
 * Использует in-memory хранилище (для dev/простых случаев)
 * Для production рекомендуется Redis-backed решение
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Очистка устаревших записей каждые 60 секунд
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, 60_000);
  }

  /**
   * Проверяет и обновляет лимит для ключа
   * @param key - уникальный идентификатор (например, workspaceId)
   * @param limit - максимальное количество запросов
   * @param windowMs - окно времени в миллисекундах
   * @returns объект с информацией о лимите
   */
  check(
    key: string,
    limit: number,
    windowMs: number,
  ): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.store.get(key);

    // Если записи нет или окно истекло - создаём новую
    if (!entry || entry.resetAt < now) {
      const resetAt = now + windowMs;
      this.store.set(key, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt,
      };
    }

    // Проверяем лимит
    if (entry.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Увеличиваем счётчик
    entry.count++;
    return {
      allowed: true,
      remaining: limit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Очистка ресурсов
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Singleton instance
let rateLimiterInstance: InMemoryRateLimiter | null = null;

export function getRateLimiter(): InMemoryRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new InMemoryRateLimiter();
  }
  return rateLimiterInstance;
}

/**
 * Проверяет rate limit для workspace
 * @param workspaceId - ID workspace
 * @param limit - максимальное количество запросов (по умолчанию 10)
 * @param windowMs - окно времени в миллисекундах (по умолчанию 60 секунд)
 */
export function checkRateLimit(
  workspaceId: string,
  limit = 10,
  windowMs = 60_000,
) {
  const limiter = getRateLimiter();
  return limiter.check(`workspace:${workspaceId}`, limit, windowMs);
}
