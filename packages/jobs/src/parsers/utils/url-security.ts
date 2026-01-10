/**
 * Утилиты для безопасной работы с URL
 * Защита от SSRF (Server-Side Request Forgery)
 */

/**
 * Проверяет, является ли IP-адрес приватным
 */
function isPrivateIP(ip: string): boolean {
  // Удаляем IPv6 обертку, если есть
  const cleanIP = ip.replace(/^\[|\]$/g, "");

  // IPv4 приватные диапазоны
  const ipv4Patterns = [
    /^127\./, // 127.0.0.0/8 - loopback
    /^10\./, // 10.0.0.0/8 - private
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12 - private
    /^192\.168\./, // 192.168.0.0/16 - private
    /^169\.254\./, // 169.254.0.0/16 - link-local
    /^0\./, // 0.0.0.0/8 - current network
  ];

  for (const pattern of ipv4Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  // IPv6 приватные адреса
  const ipv6Patterns = [
    /^::1$/, // loopback
    /^::$/, // unspecified
    /^::ffff:/, // IPv4-mapped
    /^fe80:/i, // link-local
    /^fc00:/i, // unique local
    /^fd00:/i, // unique local
  ];

  for (const pattern of ipv6Patterns) {
    if (pattern.test(cleanIP)) {
      return true;
    }
  }

  return false;
}

/**
 * Проверяет, является ли hostname локальным или приватным
 */
function isPrivateHostname(hostname: string): boolean {
  const lowerHostname = hostname.toLowerCase();

  // Проверка на localhost варианты
  const localhostPatterns = [
    "localhost",
    "localhost.localdomain",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
  ];

  if (localhostPatterns.includes(lowerHostname)) {
    return true;
  }

  // Проверка на .local домены
  if (lowerHostname.endsWith(".local")) {
    return true;
  }

  // Проверка на IP адреса
  if (isPrivateIP(lowerHostname)) {
    return true;
  }

  return false;
}

export interface URLValidationOptions {
  allowedProtocols?: string[];
  allowPrivateIPs?: boolean;
  allowLocalhostVariants?: boolean;
}

export class URLSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "URLSecurityError";
  }
}

/**
 * Валидирует URL на безопасность (защита от SSRF)
 * @throws {URLSecurityError} если URL небезопасен
 */
export function validateSecureURL(
  url: string,
  options: URLValidationOptions = {},
): URL {
  const {
    allowedProtocols = ["https:"],
    allowPrivateIPs = false,
    allowLocalhostVariants = false,
  } = options;

  let parsedURL: URL;

  try {
    parsedURL = new URL(url);
  } catch {
    throw new URLSecurityError("Невалидный URL");
  }

  // Проверка протокола
  if (!allowedProtocols.includes(parsedURL.protocol)) {
    throw new URLSecurityError(
      `Недопустимый протокол: ${parsedURL.protocol}. Разрешены: ${allowedProtocols.join(", ")}`,
    );
  }

  // Проверка на приватные IP и localhost
  if (!allowPrivateIPs || !allowLocalhostVariants) {
    const hostname = parsedURL.hostname;

    if (!allowLocalhostVariants && isPrivateHostname(hostname)) {
      throw new URLSecurityError(
        `Недопустимый hostname: ${hostname}. Локальные адреса запрещены`,
      );
    }

    if (!allowPrivateIPs && isPrivateIP(hostname)) {
      throw new URLSecurityError(
        `Недопустимый IP-адрес: ${hostname}. Приватные IP запрещены`,
      );
    }
  }

  return parsedURL;
}

export interface SecureFetchOptions extends RequestInit {
  timeout?: number;
  maxRedirects?: number;
}

/**
 * Безопасный fetch с таймаутом и защитой от SSRF
 */
export async function secureFetch(
  url: string,
  options: SecureFetchOptions = {},
): Promise<Response> {
  const { timeout = 10000, maxRedirects = 0, ...fetchOptions } = options;

  // Валидация URL
  validateSecureURL(url);

  // Настройка редиректов
  const redirect = maxRedirects === 0 ? "error" : "follow";

  // Создаем AbortController для таймаута
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      redirect,
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new URLSecurityError(`Таймаут запроса (${timeout}ms)`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
