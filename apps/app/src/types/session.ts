import type { Session as BaseSession } from "@qbs-autonaim/auth";

/**
 * Расширенный тип сессии с дополнительными полями
 * Добавляется через customSession плагин в better-auth
 */
export interface Session extends BaseSession {
  role: "admin" | "user";
}
