/**
 * Custom Domain Service Types
 *
 * Типы для сервиса управления кастомными доменами для виджета преквалификации.
 * Позволяет компаниям использовать собственные домены для виджета.
 */

// Re-export core types from DB schema for consistency
export type { CustomDomain, SSLStatus } from "@qbs-autonaim/db";

/**
 * Конфигурация кастомного домена
 */
export interface CustomDomainConfig {
  /** ID записи */
  id: string;
  /** ID workspace (tenant) */
  workspaceId: string;
  /** Доменное имя */
  domain: string;
  /** CNAME target для DNS */
  cnameTarget: string;
  /** Статус верификации DNS */
  verified: boolean;
  /** Дата верификации */
  verifiedAt?: Date | null;
  /** Дата последней попытки верификации */
  lastVerificationAttempt?: Date | null;
  /** Ошибка верификации */
  verificationError?: string | null;
  /** Статус SSL сертификата */
  sslStatus: "pending" | "active" | "expired" | "error";
  /** ID SSL сертификата в Yandex Cloud */
  sslCertificateId?: string | null;
  /** Дата истечения SSL сертификата */
  sslExpiresAt?: Date | null;
  /** Дата создания */
  createdAt: Date;
  /** Дата обновления */
  updatedAt: Date;
}

/**
 * Входные данные для регистрации домена
 */
export interface RegisterDomainInput {
  /** ID workspace (tenant) */
  workspaceId: string;
  /** Доменное имя для регистрации */
  domain: string;
}

/**
 * Результат валидации домена
 */
export interface DomainValidationResult {
  /** Валиден ли домен */
  valid: boolean;
  /** Доменное имя */
  domain: string;
  /** Ошибки валидации */
  errors: string[];
  /** Предупреждения */
  warnings: string[];
}

/**
 * Результат проверки DNS
 */
export interface DNSVerificationResult {
  /** Успешна ли верификация */
  verified: boolean;
  /** Доменное имя */
  domain: string;
  /** Ожидаемый CNAME target */
  expectedCname: string;
  /** Найденный CNAME (если есть) */
  foundCname?: string | null;
  /** Сообщение об ошибке */
  error?: string | null;
  /** Инструкции по настройке DNS */
  instructions?: DNSInstructions | null;
}

/**
 * Инструкции по настройке DNS
 */
export interface DNSInstructions {
  /** Тип записи */
  recordType: "CNAME";
  /** Имя записи (поддомен или @) */
  recordName: string;
  /** Значение записи */
  recordValue: string;
  /** TTL в секундах */
  ttl: number;
  /** Текстовые инструкции */
  steps: string[];
}

/**
 * Результат провизионирования SSL
 */
export interface SSLProvisionResult {
  /** Успешно ли провизионирование */
  success: boolean;
  /** ID сертификата */
  certificateId?: string | null;
  /** Статус сертификата */
  status: "pending" | "active" | "expired" | "error";
  /** Дата истечения */
  expiresAt?: Date | null;
  /** Сообщение об ошибке */
  error?: string | null;
}

/**
 * Результат проверки статуса SSL
 */
export interface SSLStatusResult {
  /** Статус сертификата */
  status: "pending" | "active" | "expired" | "error";
  /** ID сертификата */
  certificateId?: string | null;
  /** Дата истечения */
  expiresAt?: Date | null;
  /** Требуется ли обновление */
  needsRenewal: boolean;
  /** Сообщение об ошибке */
  error?: string | null;
}

/**
 * Полный статус домена
 */
export interface DomainStatus {
  /** Конфигурация домена */
  config: CustomDomainConfig;
  /** Статус DNS */
  dnsStatus: "pending" | "verified" | "error";
  /** Статус SSL */
  sslStatus: "pending" | "active" | "expired" | "error";
  /** Готов ли домен к использованию */
  ready: boolean;
  /** Следующие шаги для пользователя */
  nextSteps: string[];
}

/**
 * Коды ошибок сервиса кастомных доменов
 */
export type CustomDomainErrorCode =
  | "DOMAIN_ALREADY_USED"
  | "DNS_VERIFICATION_FAILED"
  | "SSL_PROVISION_FAILED"
  | "DOMAIN_NOT_FOUND"
  | "INVALID_DOMAIN_FORMAT"
  | "TENANT_MISMATCH"
  | "VERIFICATION_IN_PROGRESS"
  | "SSL_NOT_READY"
  | "DATABASE_ERROR";

/**
 * Ошибка сервиса кастомных доменов
 */
export class CustomDomainError extends Error {
  readonly code: CustomDomainErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: CustomDomainErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "CustomDomainError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Сообщения об ошибках для пользователя
 */
export const ERROR_MESSAGES: Record<CustomDomainErrorCode, string> = {
  DOMAIN_ALREADY_USED: "Домен уже используется другой компанией",
  DNS_VERIFICATION_FAILED: "DNS запись не найдена. Проверьте настройки",
  SSL_PROVISION_FAILED: "Ошибка выпуска сертификата",
  DOMAIN_NOT_FOUND: "Домен не найден",
  INVALID_DOMAIN_FORMAT: "Неверный формат домена",
  TENANT_MISMATCH: "Домен принадлежит другому workspace",
  VERIFICATION_IN_PROGRESS: "Верификация уже выполняется",
  SSL_NOT_READY: "SSL сертификат ещё не готов",
  DATABASE_ERROR: "Ошибка базы данных",
};

/**
 * Базовый CNAME target для всех кастомных доменов
 */
export const BASE_CNAME_TARGET = "widget.hh.qbs.ru";

/**
 * Минимальный интервал между попытками верификации (в миллисекундах)
 */
export const MIN_VERIFICATION_INTERVAL_MS = 60 * 1000; // 1 минута

/**
 * Количество дней до истечения SSL для предупреждения о необходимости обновления
 */
export const SSL_RENEWAL_WARNING_DAYS = 30;
