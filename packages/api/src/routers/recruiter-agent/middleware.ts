/**
 * Middleware для recruiter-agent router
 *
 * Содержит функции для:
 * - Проверки доступа к workspace
 * - Rate limiting
 * - Проверки прав на действия
 */

import type { WorkspaceRepository } from "@qbs-autonaim/db";

/**
 * In-memory rate limiter
 * В production следует использовать Redis
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Проверяет доступ пользователя к workspace
 */
export async function checkWorkspaceAccess(
  workspaceRepository: WorkspaceRepository,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const access = await workspaceRepository.checkAccess(workspaceId, userId);
  return !!access;
}

/**
 * Проверяет rate limit
 *
 * @param key - Уникальный ключ для rate limiting (например, `chat:${workspaceId}`)
 * @param limit - Максимальное количество запросов
 * @param windowSeconds - Окно времени в секундах
 * @returns true если запрос разрешён, false если превышен лимит
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Если записи нет или окно истекло, создаём новую
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
    return true;
  }

  // Проверяем лимит
  if (entry.count >= limit) {
    return false;
  }

  // Увеличиваем счётчик
  entry.count++;
  return true;
}

/**
 * Получает оставшееся количество запросов
 */
export function getRateLimitRemaining(key: string, limit: number): number {
  const entry = rateLimitStore.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    return limit;
  }
  return Math.max(0, limit - entry.count);
}

/**
 * Получает время до сброса rate limit в секундах
 */
export function getRateLimitResetIn(key: string): number {
  const entry = rateLimitStore.get(key);
  if (!entry || Date.now() > entry.resetAt) {
    return 0;
  }
  return Math.ceil((entry.resetAt - Date.now()) / 1000);
}

/**
 * Сбрасывает rate limit для ключа (для тестов)
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Очищает все rate limits (для тестов)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Типы действий, требующих проверки прав
 */
export type ActionPermission =
  | "invite_candidate"
  | "reject_candidate"
  | "send_message"
  | "configure_rules"
  | "execute_rule"
  | "undo_action";

/**
 * Проверяет права пользователя на выполнение действия
 *
 * В текущей реализации все пользователи с доступом к workspace
 * могут выполнять все действия. В будущем можно добавить
 * более гранулярную систему прав.
 */
export async function checkActionPermission(
  workspaceRepository: WorkspaceRepository,
  workspaceId: string,
  userId: string,
  _action: ActionPermission,
): Promise<boolean> {
  // Проверяем базовый доступ к workspace
  const access = await workspaceRepository.checkAccess(workspaceId, userId);
  if (!access) {
    return false;
  }

  // TODO: Добавить проверку ролей для разных действий
  // Например, только admin/owner могут configure_rules

  return true;
}
