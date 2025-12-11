/**
 * Утилиты для работы с ошибками авторизации Telegram
 */

/**
 * Известные типы ошибок авторизации Telegram
 */
export const AUTH_ERROR_TYPES = [
  "AUTH_KEY_UNREGISTERED",
  "AUTH_KEY_INVALID",
  "AUTH_KEY_PERM_EMPTY",
  "SESSION_REVOKED",
  "SESSION_EXPIRED",
  "USER_DEACTIVATED",
  "USER_DEACTIVATED_BAN",
] as const;

export type AuthErrorType = (typeof AUTH_ERROR_TYPES)[number];

export interface AuthErrorResult {
  isAuth: boolean;
  errorType?: AuthErrorType;
  errorMessage?: string;
}

/**
 * Проверяет, является ли ошибка ошибкой авторизации Telegram
 */
export function isAuthError(error: unknown): AuthErrorResult {
  if (!error || typeof error !== "object") {
    return { isAuth: false };
  }

  let errorText = "";

  if ("text" in error) {
    errorText = String(error.text);
  } else if ("message" in error) {
    errorText = String(error.message);
  } else if ("name" in error) {
    errorText = String(error.name);
  }

  for (const authError of AUTH_ERROR_TYPES) {
    if (errorText.includes(authError)) {
      return {
        isAuth: true,
        errorType: authError,
        errorMessage: errorText,
      };
    }
  }

  return { isAuth: false };
}
