/**
 * DNS Verifier Service
 *
 * Сервис для проверки DNS записей кастомных доменов.
 * Проверяет наличие корректной CNAME записи, указывающей на наш сервер.
 */

import { promises as dns } from "node:dns";

import {
  BASE_CNAME_TARGET,
  CustomDomainError,
  type DNSInstructions,
  type DNSVerificationResult,
} from "./types";

/**
 * Генерирует инструкции по настройке DNS для домена
 */
export function generateDNSInstructions(domain: string): DNSInstructions {
  // Определяем имя записи (для поддомена или корневого домена)
  const parts = domain.split(".");
  const isSubdomain = parts.length > 2;
  const recordName = isSubdomain && parts[0] ? parts[0] : "@";

  return {
    recordType: "CNAME",
    recordName,
    recordValue: BASE_CNAME_TARGET,
    ttl: 3600,
    steps: [
      `1. Войдите в панель управления DNS вашего домена`,
      `2. Создайте новую CNAME запись`,
      `3. В поле "Имя" укажите: ${isSubdomain ? parts[0] : "@"}`,
      `4. В поле "Значение" укажите: ${BASE_CNAME_TARGET}`,
      `5. Установите TTL: 3600 (1 час)`,
      `6. Сохраните изменения`,
      `7. Подождите до 24 часов для распространения DNS`,
    ],
  };
}

/**
 * Форматирует сообщение об ошибке DNS для пользователя
 */
function formatDNSError(
  domain: string,
  expectedCname: string,
  foundCname?: string | null,
): string {
  if (!foundCname) {
    return `CNAME запись для домена ${domain} не найдена. Убедитесь, что вы добавили CNAME запись, указывающую на ${expectedCname}`;
  }

  return `CNAME запись для домена ${domain} указывает на ${foundCname}, но должна указывать на ${expectedCname}`;
}

/**
 * Проверяет DNS CNAME запись для домена
 *
 * @param domain - Доменное имя для проверки
 * @param expectedCname - Ожидаемый CNAME target (по умолчанию BASE_CNAME_TARGET)
 * @returns Результат верификации DNS
 */
export async function verifyDNS(
  domain: string,
  expectedCname: string = BASE_CNAME_TARGET,
): Promise<DNSVerificationResult> {
  const instructions = generateDNSInstructions(domain);

  try {
    // Пытаемся получить CNAME записи для домена
    const cnameRecords = await dns.resolveCname(domain);

    if (!cnameRecords || cnameRecords.length === 0) {
      return {
        verified: false,
        domain,
        expectedCname,
        foundCname: null,
        error: formatDNSError(domain, expectedCname, null),
        instructions,
      };
    }

    // Проверяем, что хотя бы одна CNAME запись указывает на наш target
    // Нормализуем записи (убираем trailing dot если есть)
    const normalizedExpected = expectedCname.replace(/\.$/, "").toLowerCase();
    const firstRecord = cnameRecords[0] ?? "";
    const foundCname = firstRecord.replace(/\.$/, "").toLowerCase();

    if (foundCname === normalizedExpected) {
      return {
        verified: true,
        domain,
        expectedCname,
        foundCname: firstRecord,
        error: null,
        instructions: null,
      };
    }

    // CNAME найден, но указывает не туда
    return {
      verified: false,
      domain,
      expectedCname,
      foundCname: firstRecord,
      error: formatDNSError(domain, expectedCname, firstRecord),
      instructions,
    };
  } catch (error) {
    // Обрабатываем различные DNS ошибки
    const dnsError = error as NodeJS.ErrnoException;

    if (dnsError.code === "ENODATA" || dnsError.code === "ENOTFOUND") {
      // CNAME запись не найдена
      return {
        verified: false,
        domain,
        expectedCname,
        foundCname: null,
        error: `CNAME запись для домена ${domain} не найдена. Добавьте CNAME запись, указывающую на ${expectedCname}`,
        instructions,
      };
    }

    if (dnsError.code === "ETIMEOUT" || dnsError.code === "ECONNREFUSED") {
      // Проблемы с DNS сервером
      return {
        verified: false,
        domain,
        expectedCname,
        foundCname: null,
        error: `Не удалось проверить DNS для домена ${domain}. Попробуйте позже`,
        instructions,
      };
    }

    // Неизвестная ошибка
    return {
      verified: false,
      domain,
      expectedCname,
      foundCname: null,
      error: `Ошибка проверки DNS для домена ${domain}: ${dnsError.message}`,
      instructions,
    };
  }
}

/**
 * Проверяет, можно ли выполнить верификацию (прошло достаточно времени с последней попытки)
 *
 * @param lastAttempt - Дата последней попытки верификации
 * @param minIntervalMs - Минимальный интервал между попытками в миллисекундах
 * @returns true если можно выполнить верификацию
 */
export function canAttemptVerification(
  lastAttempt: Date | null | undefined,
  minIntervalMs: number,
): boolean {
  if (!lastAttempt) {
    return true;
  }

  const now = Date.now();
  const lastAttemptTime = lastAttempt.getTime();

  return now - lastAttemptTime >= minIntervalMs;
}

/**
 * Валидирует формат доменного имени
 *
 * @param domain - Доменное имя для валидации
 * @returns true если формат валиден
 */
export function isValidDomainFormat(domain: string): boolean {
  // Базовая валидация формата домена
  // Должен содержать хотя бы одну точку, не начинаться/заканчиваться точкой или дефисом
  const domainRegex =
    /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.[A-Za-z0-9-]{1,63})*\.[A-Za-z]{2,}$/;
  return domainRegex.test(domain);
}

/**
 * Создаёт ошибку верификации DNS
 */
export function createDNSVerificationError(
  result: DNSVerificationResult,
): CustomDomainError {
  return new CustomDomainError(
    "DNS_VERIFICATION_FAILED",
    result.error || "DNS запись не найдена. Проверьте настройки",
    {
      domain: result.domain,
      expectedCname: result.expectedCname,
      foundCname: result.foundCname,
      instructions: result.instructions,
    },
  );
}
