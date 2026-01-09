/**
 * ActionExecutor - Исполнитель действий с логированием и возможностью отмены
 *
 * Выполняет действия правил с:
 * - Логированием в audit log
 * - Возможностью отмены в течение undo window
 * - Поддержкой разных уровней автономности
 */

import type {
  AutomationRule,
  CandidateRuleData,
  RuleAction,
  RuleActionType,
  RuleExecutionResult,
} from "../rules/rule-engine";
import {
  type AutonomyLevelHandler,
  getAutonomyHandler,
  getRuleEngine,
  type PendingApproval,
} from "../rules/rule-engine";

/**
 * Запись в audit log
 */
export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  userId?: string;
  actionType: RuleActionType;
  ruleId?: string;
  ruleName?: string;
  candidateId: string;
  vacancyId?: string;
  params: Record<string, unknown>;
  result: "executed" | "failed" | "pending_approval" | "advised" | "undone";
  explanation: string;
  timestamp: Date;
  undoDeadline?: Date;
  undoneAt?: Date;
  undoneBy?: string;
  error?: string;
}

/**
 * Выполненное действие с возможностью отмены
 */
export interface ExecutedActionRecord {
  id: string;
  workspaceId: string;
  ruleId: string;
  ruleName: string;
  candidateId: string;
  vacancyId?: string;
  action: RuleAction;
  status: "executed" | "pending_approval" | "advised" | "undone" | "failed";
  explanation: string;
  timestamp: Date;
  canUndo: boolean;
  undoDeadline?: Date;
  undoneAt?: Date;
  undoneBy?: string;
  error?: string;
}

/**
 * Конфигурация ActionExecutor
 */
export interface ActionExecutorConfig {
  undoWindowMinutes: number;
  enableAuditLog: boolean;
  notifyOnComplete: boolean;
  maxRetries: number;
}

/**
 * Callback для выполнения действия
 */
export type ActionHandler = (
  action: RuleAction,
  candidateId: string,
  vacancyId?: string,
) => Promise<{ success: boolean; error?: string }>;

/**
 * Callback для отмены действия
 */
export type UndoHandler = (
  executedAction: ExecutedActionRecord,
) => Promise<{ success: boolean; error?: string }>;

/**
 * ActionExecutor - основной класс для выполнения действий
 */
export class ActionExecutor {
  private config: ActionExecutorConfig;
  private auditLog: AuditLogEntry[] = [];
  private executedActions: Map<string, ExecutedActionRecord> = new Map();
  private actionHandlers: Map<RuleActionType, ActionHandler> = new Map();
  private undoHandlers: Map<RuleActionType, UndoHandler> = new Map();
  private autonomyHandler: AutonomyLevelHandler;

  constructor(config: Partial<ActionExecutorConfig> = {}) {
    this.config = {
      undoWindowMinutes: config.undoWindowMinutes ?? 30,
      enableAuditLog: config.enableAuditLog ?? true,
      notifyOnComplete: config.notifyOnComplete ?? true,
      maxRetries: config.maxRetries ?? 3,
    };
    this.autonomyHandler = getAutonomyHandler();
  }

  /**
   * Регистрирует обработчик для типа действия
   */
  registerActionHandler(type: RuleActionType, handler: ActionHandler): void {
    this.actionHandlers.set(type, handler);
  }

  /**
   * Регистрирует обработчик отмены для типа действия
   */
  registerUndoHandler(type: RuleActionType, handler: UndoHandler): void {
    this.undoHandlers.set(type, handler);
  }

  /**
   * Выполняет действие правила
   */
  async executeAction(
    rule: AutomationRule,
    candidate: CandidateRuleData,
    workspaceId: string,
    vacancyId?: string,
    userId?: string,
  ): Promise<RuleExecutionResult> {
    const ruleEngine = getRuleEngine();

    // Проверяем rate limiting
    if (!ruleEngine.canExecuteAction(workspaceId)) {
      return this.createFailedResult(
        rule,
        candidate.id,
        "Превышен лимит действий в час",
      );
    }

    // Определяем статус на основе уровня автономности
    const executionStatus = this.autonomyHandler.determineExecutionStatus(
      rule.autonomyLevel,
    );

    // Создаём запись о выполнении
    const executedAction = this.createExecutedActionRecord(
      rule,
      candidate.id,
      workspaceId,
      vacancyId,
      executionStatus,
    );

    // Если требуется подтверждение
    if (executionStatus === "pending_approval") {
      const pendingApproval = this.autonomyHandler.createPendingApproval(
        rule.id,
        rule.name,
        candidate.id,
        rule.action,
        executedAction.explanation,
        workspaceId,
      );

      this.executedActions.set(executedAction.id, executedAction);
      this.logToAudit(executedAction, workspaceId, userId);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        candidateId: candidate.id,
        action: rule.action,
        status: "pending_approval",
        explanation: `Действие ожидает подтверждения. ID: ${pendingApproval.id}`,
        timestamp: executedAction.timestamp,
        canUndo: false,
      };
    }

    // Если только рекомендация
    if (executionStatus === "advised") {
      this.executedActions.set(executedAction.id, executedAction);
      this.logToAudit(executedAction, workspaceId, userId);

      return {
        ruleId: rule.id,
        ruleName: rule.name,
        candidateId: candidate.id,
        action: rule.action,
        status: "advised",
        explanation: executedAction.explanation,
        timestamp: executedAction.timestamp,
        canUndo: false,
      };
    }

    // Выполняем действие автоматически
    const result = await this.performAction(
      rule.action,
      candidate.id,
      vacancyId,
    );

    if (!result.success) {
      executedAction.status = "failed";
      executedAction.error = result.error;
      this.executedActions.set(executedAction.id, executedAction);
      this.logToAudit(executedAction, workspaceId, userId);

      return this.createFailedResult(
        rule,
        candidate.id,
        result.error ?? "Неизвестная ошибка",
      );
    }

    // Успешное выполнение
    executedAction.status = "executed";
    this.executedActions.set(executedAction.id, executedAction);
    this.logToAudit(executedAction, workspaceId, userId);

    // Обновляем статистику правила
    ruleEngine.updateRuleStats(rule.id, (prev) => ({
      executed: prev.executed + 1,
    }));

    // Увеличиваем счётчик действий
    ruleEngine.incrementActionCount(workspaceId);

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      candidateId: candidate.id,
      action: rule.action,
      status: "executed",
      explanation: executedAction.explanation,
      timestamp: executedAction.timestamp,
      canUndo: executedAction.canUndo,
      undoDeadline: executedAction.undoDeadline,
    };
  }

  /**
   * Выполняет действие после подтверждения
   */
  async executeApprovedAction(
    approvalId: string,
    workspaceId: string,
    userId?: string,
  ): Promise<RuleExecutionResult | null> {
    const approval = this.autonomyHandler.approve(approvalId);
    if (!approval) {
      return null;
    }

    const ruleEngine = getRuleEngine();
    const rule = ruleEngine.getRule(approval.ruleId);
    if (!rule) {
      return null;
    }

    // Выполняем действие
    const result = await this.performAction(
      approval.action,
      approval.candidateId,
    );

    const executedAction = this.createExecutedActionRecord(
      rule,
      approval.candidateId,
      workspaceId,
      undefined,
      result.success ? "executed" : "failed",
    );

    if (!result.success) {
      executedAction.status = "failed";
      executedAction.error = result.error;
    }

    this.executedActions.set(executedAction.id, executedAction);
    this.logToAudit(executedAction, workspaceId, userId);

    if (result.success) {
      ruleEngine.updateRuleStats(rule.id, (prev) => ({
        executed: prev.executed + 1,
      }));
      ruleEngine.incrementActionCount(workspaceId);
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      candidateId: approval.candidateId,
      action: approval.action,
      status: result.success ? "executed" : "failed",
      explanation: executedAction.explanation,
      timestamp: executedAction.timestamp,
      canUndo: executedAction.canUndo,
      undoDeadline: executedAction.undoDeadline,
      error: result.error,
    };
  }

  /**
   * Отменяет выполненное действие
   */
  async undoAction(
    actionId: string,
    userId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const executedAction = this.executedActions.get(actionId);
    if (!executedAction) {
      return { success: false, error: "Действие не найдено" };
    }

    if (!executedAction.canUndo) {
      return { success: false, error: "Действие не может быть отменено" };
    }

    if (executedAction.status === "undone") {
      return { success: false, error: "Действие уже отменено" };
    }

    if (
      executedAction.undoDeadline &&
      new Date() > executedAction.undoDeadline
    ) {
      return { success: false, error: "Время для отмены истекло" };
    }

    // Выполняем отмену
    const undoHandler = this.undoHandlers.get(executedAction.action.type);
    if (undoHandler) {
      const result = await undoHandler(executedAction);
      if (!result.success) {
        return result;
      }
    }

    // Обновляем статус
    executedAction.status = "undone";
    executedAction.undoneAt = new Date();
    executedAction.undoneBy = userId;
    executedAction.canUndo = false;

    // Обновляем статистику правила
    const ruleEngine = getRuleEngine();
    const rule = ruleEngine.getRule(executedAction.ruleId);
    if (rule) {
      ruleEngine.updateRuleStats(rule.id, (prev) => ({
        undone: prev.undone + 1,
      }));
    }

    // Логируем отмену
    this.logUndoToAudit(executedAction, userId);

    return { success: true };
  }

  /**
   * Проверяет, можно ли отменить действие
   */
  canUndoAction(actionId: string): boolean {
    const executedAction = this.executedActions.get(actionId);
    if (!executedAction) {
      return false;
    }

    if (!executedAction.canUndo || executedAction.status === "undone") {
      return false;
    }

    if (
      executedAction.undoDeadline &&
      new Date() > executedAction.undoDeadline
    ) {
      return false;
    }

    return true;
  }

  /**
   * Получает время до истечения undo window
   */
  getUndoTimeRemaining(actionId: string): number | null {
    const executedAction = this.executedActions.get(actionId);
    if (!executedAction?.undoDeadline) {
      return null;
    }

    const remaining = executedAction.undoDeadline.getTime() - Date.now();
    return Math.max(0, remaining);
  }

  /**
   * Получает выполненное действие по ID
   */
  getExecutedAction(actionId: string): ExecutedActionRecord | undefined {
    return this.executedActions.get(actionId);
  }

  /**
   * Получает все выполненные действия для workspace
   */
  getExecutedActionsForWorkspace(workspaceId: string): ExecutedActionRecord[] {
    return Array.from(this.executedActions.values()).filter(
      (a) => a.workspaceId === workspaceId,
    );
  }

  /**
   * Получает действия, которые можно отменить
   */
  getUndoableActions(workspaceId: string): ExecutedActionRecord[] {
    const now = new Date();
    return Array.from(this.executedActions.values()).filter(
      (a) =>
        a.workspaceId === workspaceId &&
        a.canUndo &&
        a.status === "executed" &&
        (!a.undoDeadline || a.undoDeadline > now),
    );
  }

  /**
   * Получает pending approvals
   */
  getPendingApprovals(workspaceId?: string): PendingApproval[] {
    return this.autonomyHandler.getPendingApprovals(workspaceId);
  }

  /**
   * Отклоняет pending approval
   */
  rejectApproval(approvalId: string): boolean {
    const approval = this.autonomyHandler.reject(approvalId);
    return approval !== null;
  }

  /**
   * Получает audit log
   */
  getAuditLog(workspaceId?: string): AuditLogEntry[] {
    if (workspaceId) {
      return this.auditLog.filter((e) => e.workspaceId === workspaceId);
    }
    return [...this.auditLog];
  }

  /**
   * Получает audit log для кандидата
   */
  getAuditLogForCandidate(candidateId: string): AuditLogEntry[] {
    return this.auditLog.filter((e) => e.candidateId === candidateId);
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(config: Partial<ActionExecutorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Получает текущую конфигурацию
   */
  getConfig(): ActionExecutorConfig {
    return { ...this.config };
  }

  /**
   * Выполняет действие через зарегистрированный обработчик
   */
  private async performAction(
    action: RuleAction,
    candidateId: string,
    vacancyId?: string,
  ): Promise<{ success: boolean; error?: string }> {
    const handler = this.actionHandlers.get(action.type);
    if (!handler) {
      // Если нет обработчика, считаем действие успешным (mock)
      return { success: true };
    }

    try {
      return await handler(action, candidateId, vacancyId);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }

  /**
   * Создаёт запись о выполненном действии
   */
  private createExecutedActionRecord(
    rule: AutomationRule,
    candidateId: string,
    workspaceId: string,
    vacancyId: string | undefined,
    status: ExecutedActionRecord["status"],
  ): ExecutedActionRecord {
    const now = new Date();
    const undoDeadline = new Date(now);
    undoDeadline.setMinutes(
      undoDeadline.getMinutes() + this.config.undoWindowMinutes,
    );

    const actionLabels: Record<RuleActionType, string> = {
      invite: "приглашение на интервью",
      clarify: "уточняющие вопросы",
      reject: "отклонение",
      notify: "уведомление рекрутера",
      pause_vacancy: "приостановка вакансии",
      tag: "добавление тега",
    };

    return {
      id: crypto.randomUUID(),
      workspaceId,
      ruleId: rule.id,
      ruleName: rule.name,
      candidateId,
      vacancyId,
      action: rule.action,
      status,
      explanation: `Правило "${rule.name}": ${actionLabels[rule.action.type]}`,
      timestamp: now,
      canUndo: status === "executed",
      undoDeadline: status === "executed" ? undoDeadline : undefined,
    };
  }

  /**
   * Создаёт результат с ошибкой
   */
  private createFailedResult(
    rule: AutomationRule,
    candidateId: string,
    error: string,
  ): RuleExecutionResult {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      candidateId,
      action: rule.action,
      status: "failed",
      explanation: `Ошибка выполнения правила "${rule.name}": ${error}`,
      timestamp: new Date(),
      canUndo: false,
      error,
    };
  }

  /**
   * Логирует действие в audit log
   */
  private logToAudit(
    executedAction: ExecutedActionRecord,
    workspaceId: string,
    userId?: string,
  ): void {
    if (!this.config.enableAuditLog) {
      return;
    }

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      workspaceId,
      userId,
      actionType: executedAction.action.type,
      ruleId: executedAction.ruleId,
      ruleName: executedAction.ruleName,
      candidateId: executedAction.candidateId,
      vacancyId: executedAction.vacancyId,
      params: executedAction.action.params ?? {},
      result: executedAction.status,
      explanation: executedAction.explanation,
      timestamp: executedAction.timestamp,
      undoDeadline: executedAction.undoDeadline,
      error: executedAction.error,
    };

    this.auditLog.push(entry);
  }

  /**
   * Логирует отмену в audit log
   */
  private logUndoToAudit(
    executedAction: ExecutedActionRecord,
    userId?: string,
  ): void {
    if (!this.config.enableAuditLog) {
      return;
    }

    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      workspaceId: executedAction.workspaceId,
      userId,
      actionType: executedAction.action.type,
      ruleId: executedAction.ruleId,
      ruleName: executedAction.ruleName,
      candidateId: executedAction.candidateId,
      vacancyId: executedAction.vacancyId,
      params: executedAction.action.params ?? {},
      result: "undone",
      explanation: `Отмена действия: ${executedAction.explanation}`,
      timestamp: new Date(),
      undoneAt: executedAction.undoneAt,
      undoneBy: executedAction.undoneBy,
    };

    this.auditLog.push(entry);
  }

  /**
   * Очищает все данные (для тестов)
   */
  clear(): void {
    this.auditLog = [];
    this.executedActions.clear();
    this.autonomyHandler.clearAll();
  }
}

/**
 * Singleton instance для использования в приложении
 */
let actionExecutorInstance: ActionExecutor | null = null;

export function getActionExecutor(
  config?: Partial<ActionExecutorConfig>,
): ActionExecutor {
  if (!actionExecutorInstance) {
    actionExecutorInstance = new ActionExecutor(config);
  } else if (config) {
    actionExecutorInstance.updateConfig(config);
  }
  return actionExecutorInstance;
}

/**
 * Сбрасывает singleton (для тестов)
 */
export function resetActionExecutor(): void {
  actionExecutorInstance = null;
}
