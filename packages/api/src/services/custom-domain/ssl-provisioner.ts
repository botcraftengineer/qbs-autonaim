/**
 * SSL Provisioner Service
 *
 * Сервис для управления SSL сертификатами через Yandex Cloud Certificate Manager.
 * Обеспечивает автоматическое провизионирование и обновление сертификатов для кастомных доменов.
 */

import {
  CustomDomainError,
  SSL_RENEWAL_WARNING_DAYS,
  type SSLProvisionResult,
  type SSLStatusResult,
} from "./types";

/**
 * Конфигурация Yandex Cloud Certificate Manager
 */
export interface YandexCloudConfig {
  /** ID сервисного аккаунта */
  serviceAccountId?: string;
  /** ID каталога (folder) */
  folderId?: string;
  /** IAM токен для авторизации */
  iamToken?: string;
  /** Endpoint API (для тестирования) */
  apiEndpoint?: string;
}

/**
 * Интерфейс для работы с Yandex Cloud Certificate Manager API
 * Абстракция для возможности мокирования в тестах
 */
export interface CertificateManagerClient {
  /** Создать запрос на сертификат */
  requestCertificate(domain: string): Promise<{ certificateId: string }>;
  /** Получить статус сертификата */
  getCertificateStatus(
    certificateId: string,
  ): Promise<{ status: string; expiresAt?: Date }>;
  /** Удалить сертификат */
  deleteCertificate(certificateId: string): Promise<void>;
}

/**
 * Реализация клиента Yandex Cloud Certificate Manager
 *
 * NOTE: Это заглушка для интеграции с реальным API.
 * В продакшене нужно использовать @yandex-cloud/nodejs-sdk
 */
export class YandexCloudCertificateManager implements CertificateManagerClient {
  private readonly apiEndpoint: string;

  constructor(config: YandexCloudConfig = {}) {
    this.apiEndpoint =
      config.apiEndpoint || "https://certificate-manager.api.cloud.yandex.net";
  }

  /**
   * Запрашивает новый SSL сертификат для домена
   *
   * В реальной реализации:
   * 1. Создаёт запрос на Let's Encrypt сертификат через Yandex Cloud CM
   * 2. Возвращает ID сертификата для отслеживания статуса
   */
  async requestCertificate(domain: string): Promise<{ certificateId: string }> {
    // TODO: Реализовать интеграцию с Yandex Cloud Certificate Manager API
    // Используя @yandex-cloud/nodejs-sdk или REST API
    //
    // Пример REST API вызова:
    // POST https://certificate-manager.api.cloud.yandex.net/certificate-manager/v1/certificates
    // {
    //   "folderId": this.config.folderId,
    //   "name": `widget-${domain}`,
    //   "domains": [domain],
    //   "managed": {
    //     "challengeType": "DNS"
    //   }
    // }

    console.log(
      `[SSL Provisioner] Requesting certificate for domain: ${domain}`,
    );

    // Временная заглушка - генерируем фейковый ID
    // В продакшене здесь будет реальный вызов API
    const certificateId = `cert-${Date.now()}-${domain.replace(/\./g, "-")}`;

    return { certificateId };
  }

  /**
   * Получает статус сертификата
   *
   * Возможные статусы в Yandex Cloud:
   * - VALIDATING: Проверка владения доменом
   * - ISSUED: Сертификат выпущен
   * - INVALID: Ошибка валидации
   * - REVOKED: Сертификат отозван
   */
  async getCertificateStatus(
    certificateId: string,
  ): Promise<{ status: string; expiresAt?: Date }> {
    // TODO: Реализовать интеграцию с Yandex Cloud Certificate Manager API
    //
    // Пример REST API вызова:
    // GET https://certificate-manager.api.cloud.yandex.net/certificate-manager/v1/certificates/{certificateId}

    console.log(
      `[SSL Provisioner] Checking certificate status: ${certificateId}`,
    );

    // Временная заглушка
    // В продакшене здесь будет реальный вызов API
    return {
      status: "VALIDATING",
      expiresAt: undefined,
    };
  }

  /**
   * Удаляет сертификат
   */
  async deleteCertificate(certificateId: string): Promise<void> {
    // TODO: Реализовать интеграцию с Yandex Cloud Certificate Manager API
    //
    // Пример REST API вызова:
    // DELETE https://certificate-manager.api.cloud.yandex.net/certificate-manager/v1/certificates/{certificateId}

    console.log(`[SSL Provisioner] Deleting certificate: ${certificateId}`);
  }
}

/**
 * Маппинг статусов Yandex Cloud на внутренние статусы
 */
function mapYandexCloudStatus(
  ycStatus: string,
): "pending" | "active" | "expired" | "error" {
  switch (ycStatus.toUpperCase()) {
    case "ISSUED":
      return "active";
    case "VALIDATING":
    case "PENDING":
      return "pending";
    case "EXPIRED":
      return "expired";
    case "INVALID":
    case "REVOKED":
    case "ERROR":
      return "error";
    default:
      return "pending";
  }
}

/**
 * Провизионирует SSL сертификат для домена
 *
 * @param domain - Доменное имя
 * @param client - Клиент Certificate Manager (опционально, для DI)
 * @returns Результат провизионирования
 */
export async function provisionSSL(
  domain: string,
  client: CertificateManagerClient = new YandexCloudCertificateManager(),
): Promise<SSLProvisionResult> {
  try {
    const result = await client.requestCertificate(domain);

    return {
      success: true,
      certificateId: result.certificateId,
      status: "pending",
      expiresAt: null,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    console.error(
      `[SSL Provisioner] Failed to provision certificate for ${domain}:`,
      error,
    );

    return {
      success: false,
      certificateId: null,
      status: "error",
      expiresAt: null,
      error: `Ошибка выпуска сертификата: ${errorMessage}`,
    };
  }
}

/**
 * Проверяет статус SSL сертификата
 *
 * @param certificateId - ID сертификата
 * @param client - Клиент Certificate Manager (опционально, для DI)
 * @returns Статус сертификата
 */
export async function checkSSLStatus(
  certificateId: string,
  client: CertificateManagerClient = new YandexCloudCertificateManager(),
): Promise<SSLStatusResult> {
  try {
    const result = await client.getCertificateStatus(certificateId);
    const status = mapYandexCloudStatus(result.status);

    // Проверяем, нужно ли обновление
    let needsRenewal = false;
    if (result.expiresAt) {
      const daysUntilExpiry = Math.floor(
        (result.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      needsRenewal = daysUntilExpiry <= SSL_RENEWAL_WARNING_DAYS;
    }

    return {
      status,
      certificateId,
      expiresAt: result.expiresAt ?? null,
      needsRenewal,
      error: null,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Неизвестная ошибка";

    console.error(
      `[SSL Provisioner] Failed to check certificate status for ${certificateId}:`,
      error,
    );

    return {
      status: "error",
      certificateId,
      expiresAt: null,
      needsRenewal: false,
      error: `Ошибка проверки статуса сертификата: ${errorMessage}`,
    };
  }
}

/**
 * Удаляет SSL сертификат
 *
 * @param certificateId - ID сертификата
 * @param client - Клиент Certificate Manager (опционально, для DI)
 */
export async function deleteSSLCertificate(
  certificateId: string,
  client: CertificateManagerClient = new YandexCloudCertificateManager(),
): Promise<void> {
  try {
    await client.deleteCertificate(certificateId);
  } catch (error) {
    console.error(
      `[SSL Provisioner] Failed to delete certificate ${certificateId}:`,
      error,
    );
    throw new CustomDomainError(
      "SSL_PROVISION_FAILED",
      "Ошибка удаления сертификата",
      { certificateId },
    );
  }
}

/**
 * Проверяет, нужно ли обновить сертификат
 *
 * @param expiresAt - Дата истечения сертификата
 * @returns true если сертификат истекает в ближайшие SSL_RENEWAL_WARNING_DAYS дней
 */
export function needsRenewal(expiresAt: Date | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  const daysUntilExpiry = Math.floor(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  return daysUntilExpiry <= SSL_RENEWAL_WARNING_DAYS;
}
