import type { DbClient } from "@qbs-autonaim/db";
import type { CreateAuditLog } from "@qbs-autonaim/db/schema";
import { auditLog } from "@qbs-autonaim/db/schema";

export class AuditLoggerService {
  constructor(private db: DbClient) {}

  /**
   * Логирует доступ к персональным данным
   */
  async logAccess(params: {
    userId: string;
    action: CreateAuditLog["action"];
    resourceType: CreateAuditLog["resourceType"];
    resourceId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    try {
      await this.db.insert(auditLog).values({
        userId: params.userId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      });
    } catch (error) {
      // Логируем ошибку, но не прерываем основной поток
      console.error("Failed to log audit entry:", error);
    }
  }

  /**
   * Логирует просмотр отклика фрилансера
   */
  async logResponseView(params: {
    userId: string;
    responseId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "VIEW",
      resourceType: "VACANCY_RESPONSE",
      resourceId: params.responseId,
      metadata: { type: "response_view" },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует экспорт данных
   */
  async logDataExport(params: {
    userId: string;
    resourceType: CreateAuditLog["resourceType"];
    resourceId: string;
    exportFormat?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "EXPORT",
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      metadata: { exportFormat: params.exportFormat },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к контактной информации
   */
  async logContactAccess(params: {
    userId: string;
    responseId: string;
    contactType: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "CONTACT_INFO",
      resourceId: params.responseId,
      metadata: { contactType: params.contactType },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к резюме
   */
  async logResumeAccess(params: {
    userId: string;
    responseId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "RESUME",
      resourceId: params.responseId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует доступ к разговору
   */
  async logConversationAccess(params: {
    userId: string;
    conversationId: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "ACCESS",
      resourceType: "CONVERSATION",
      resourceId: params.conversationId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }

  /**
   * Логирует удаление вакансии
   */
  async logVacancyDeletion(params: {
    userId: string;
    vacancyId: string;
    deletionType: "anonymize" | "delete";
    ipAddress?: string;
    userAgent?: string;
  }): Promise<void> {
    await this.logAccess({
      userId: params.userId,
      action: "DELETE",
      resourceType: "VACANCY",
      resourceId: params.vacancyId,
      metadata: { deletionType: params.deletionType },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  }
}
