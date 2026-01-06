/**
 * RuleEngine - Система правил для автономного принятия решений
 *
 * Позволяет настраивать правила для автоматической обработки кандидатов:
 * - Условия на основе fitScore, salary, experience, availability
 * - Действия: invite, clarify, reject, notify, pause_vacancy, tag
 * - Три уровня автономности: advise, confirm, autonomous
 */

import { v4 as uuidv4 } from "uuid";
import type { CandidateResult } from "./types";

/**
 * Типы полей для условий правил
 */
export type RuleConditionField =
  | "fitScore"
  | "salaryExpectation"
  | "experience"
  | "availability"
  | "skills"
  | "resumeScore"
  | "interviewScore";

/**
 * Операторы сравнения для условий
 */
export type RuleConditionOperator =
  | ">"
  | "<"
  | "="
  | ">="
  | "<="
  | "!="
  | "contains"
  | "not_contains";

/**
 * Условие правила
 */
export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string | number | string[];
}

/**
 * Составное условие (AND/OR)
 */
export interface CompositeCondition {
  type: "AND" | "OR";
  conditions: Array<RuleCondition | CompositeCondition>;
}

/**
 * Типы действий правил
 */
export type RuleActionType =
  | "invite"
  | "clarify"
  | "reject"
  | "notify"
  | "pause_vacancy"
  | "tag";

/**
 * Действие правила
 */
export interface RuleAction {
  type: RuleActionType;
  params?: {
    messageTemplate?: string;
    notificationChannel?: "email" | "telegram" | "sms";
    tag?: string;
    reason?: string;
  };
}

/**
 * Уровень автономности
 */
export type AutonomyLevel = "advise" | "confirm" | "autonomous";

/**
 * Правило автоматизации
 */
export interface AutomationRule {
  id: string;
  workspaceId: string;
  vacancyId?: string; // null = applies to all vacancies
  name: string;
  description: string;
  condition: RuleCondition | CompositeCondition;
  action: RuleAction;
  autonomyLevel: AutonomyLevel;
  priority: number; // Higher = more important
  enabled: boolean;
  stats: {
    triggered: number;
    executed: number;
    undone: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Результат применения правила
 */
export interface RuleApplicationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  action?: RuleAction;
  autonomyLevel?: AutonomyLevel;
  explanation: string;
  timestamp: Date;
}

/**
 * Результат выполнения правила
 */
export interface RuleExecutionResult {
  ruleId: string;
  ruleName: string;
  candidateId: string;
  action: RuleAction;
  status: "executed" | "pending_approval" | "advised" | "failed";
  explanation: string;
  timestamp: Date;
  canUndo: boolean;
  undoDeadline?: Date;
  error?: string;
}

/**
 * Конфигурация Rule Engine
 */
export interface RuleEngineConfig {
  autonomyLevel: AutonomyLevel;
  maxActionsPerHour: number;
  undoWindowMinutes: number;
  enableLogging: boolean;
}

/**
 * Данные кандидата для оценки правил
 */
export interface CandidateRuleData {
  id: string;
  fitScore: number;
  resumeScore: number;
  interviewScore?: number;
  salaryExpectation?: number;
  experience?: number;
  availability?: "immediate" | "2_weeks" | "1_month" | "unknown";
  skills?: string[];
}

/**
 * Конвертирует CandidateResult в CandidateRuleData
 * @param candidate - результат кандидата
 * @param extra - дополнительные поля (salaryExpectation, experience, skills)
 */
export function candidateResultToRuleData(
  candidate: CandidateResult,
  extra?: Partial<
    Pick<CandidateRuleData, "salaryExpectation" | "experience" | "skills">
  >,
): CandidateRuleData {
  return {
    id: candidate.id,
    fitScore: candidate.fitScore,
    resumeScore: candidate.resumeScore,
    interviewScore: candidate.interviewScore,
    availability: candidate.availability.status,
    salaryExpectation: extra?.salaryExpectation,
    experience: extra?.experience,
    skills: extra?.skills,
  };
}

/**
 * Проверяет, является ли условие составным
 */
function isCompositeCondition(
  condition: RuleCondition | CompositeCondition,
): condition is CompositeCondition {
  return (
    "type" in condition && ("AND" === condition.type || "OR" === condition.type)
  );
}

/**
 * Получает значение поля из данных кандидата
 */
function getFieldValue(
  candidate: CandidateRuleData,
  field: RuleConditionField,
): string | number | string[] | undefined {
  switch (field) {
    case "fitScore":
      return candidate.fitScore;
    case "resumeScore":
      return candidate.resumeScore;
    case "interviewScore":
      return candidate.interviewScore;
    case "salaryExpectation":
      return candidate.salaryExpectation;
    case "experience":
      return candidate.experience;
    case "availability":
      return candidate.availability;
    case "skills":
      return candidate.skills;
    default:
      return undefined;
  }
}

/**
 * Оценивает простое условие
 */
function evaluateSimpleCondition(
  candidate: CandidateRuleData,
  condition: RuleCondition,
): boolean {
  const fieldValue = getFieldValue(candidate, condition.field);

  // Если поле не определено, условие не выполняется
  if (fieldValue === undefined) {
    return false;
  }

  const { operator, value } = condition;

  // Обработка числовых сравнений
  if (typeof fieldValue === "number" && typeof value === "number") {
    switch (operator) {
      case ">":
        return fieldValue > value;
      case "<":
        return fieldValue < value;
      case "=":
        return fieldValue === value;
      case ">=":
        return fieldValue >= value;
      case "<=":
        return fieldValue <= value;
      case "!=":
        return fieldValue !== value;
      default:
        return false;
    }
  }

  // Обработка строковых сравнений
  if (typeof fieldValue === "string" && typeof value === "string") {
    switch (operator) {
      case "=":
        return fieldValue === value;
      case "!=":
        return fieldValue !== value;
      case "contains":
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      case "not_contains":
        return !fieldValue.toLowerCase().includes(value.toLowerCase());
      default:
        return false;
    }
  }

  // Обработка массивов (skills)
  if (Array.isArray(fieldValue)) {
    if (typeof value === "string") {
      switch (operator) {
        case "contains":
          return fieldValue.some(
            (v) => v.toLowerCase() === value.toLowerCase(),
          );
        case "not_contains":
          return !fieldValue.some(
            (v) => v.toLowerCase() === value.toLowerCase(),
          );
        default:
          return false;
      }
    }
    if (Array.isArray(value)) {
      switch (operator) {
        case "contains":
          // Все значения из value должны быть в fieldValue
          return value.every((v) =>
            fieldValue.some((fv) => fv.toLowerCase() === v.toLowerCase()),
          );
        case "not_contains":
          // Ни одно значение из value не должно быть в fieldValue
          return !value.some((v) =>
            fieldValue.some((fv) => fv.toLowerCase() === v.toLowerCase()),
          );
        default:
          return false;
      }
    }
  }

  return false;
}

/**
 * Оценивает составное условие (AND/OR)
 */
function evaluateCompositeCondition(
  candidate: CandidateRuleData,
  condition: CompositeCondition,
): boolean {
  const results = condition.conditions.map((c) =>
    evaluateCondition(candidate, c),
  );

  if (condition.type === "AND") {
    return results.every((r) => r);
  }
  // OR
  return results.some((r) => r);
}

/**
 * Оценивает условие (простое или составное)
 */
export function evaluateCondition(
  candidate: CandidateRuleData,
  condition: RuleCondition | CompositeCondition,
): boolean {
  if (isCompositeCondition(condition)) {
    return evaluateCompositeCondition(candidate, condition);
  }
  return evaluateSimpleCondition(candidate, condition);
}

/**
 * Генерирует объяснение для результата применения правила
 */
function generateExplanation(
  rule: AutomationRule,
  matched: boolean,
  candidate: CandidateRuleData,
): string {
  if (!matched) {
    return `Правило "${rule.name}" не применимо к кандидату`;
  }

  const actionLabels: Record<RuleActionType, string> = {
    invite: "приглашение на интервью",
    clarify: "уточняющие вопросы",
    reject: "отклонение",
    notify: "уведомление рекрутера",
    pause_vacancy: "приостановка вакансии",
    tag: "добавление тега",
  };

  const actionLabel = actionLabels[rule.action.type];

  return (
    `Правило "${rule.name}" сработало: рекомендуется ${actionLabel}. ` +
    `FitScore кандидата: ${candidate.fitScore}`
  );
}

/**
 * Rule Engine - основной класс для работы с правилами
 */
export class RuleEngine {
  private rules: AutomationRule[] = [];
  private config: RuleEngineConfig;
  private actionCountPerHour: Map<string, number> = new Map();
  private lastHourReset: Date = new Date();

  constructor(config: Partial<RuleEngineConfig> = {}) {
    this.config = {
      autonomyLevel: config.autonomyLevel ?? "advise",
      maxActionsPerHour: config.maxActionsPerHour ?? 100,
      undoWindowMinutes: config.undoWindowMinutes ?? 30,
      enableLogging: config.enableLogging ?? true,
    };
  }

  /**
   * Добавляет правило
   */
  addRule(rule: AutomationRule): void {
    // Валидируем правило перед добавлением
    this.validateRule(rule);

    // Проверяем, что правило с таким ID не существует
    const existingIndex = this.rules.findIndex((r) => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
    // Сортируем по приоритету (высший приоритет первым)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Валидирует правило перед добавлением
   */
  private validateRule(rule: AutomationRule): void {
    // Валидируем условие
    this.validateCondition(rule.condition);

    // Валидируем действие
    this.validateAction(rule.action);
  }

  /**
   * Валидирует условие (простое или составное)
   */
  private validateCondition(
    condition: RuleCondition | CompositeCondition,
  ): void {
    if (isCompositeCondition(condition)) {
      // Валидируем составное условие
      if (!condition.conditions || condition.conditions.length === 0) {
        throw new Error(
          `Composite condition (${condition.type}) must have at least one condition`,
        );
      }

      // Рекурсивно валидируем вложенные условия
      for (const subCondition of condition.conditions) {
        this.validateCondition(subCondition);
      }
    } else {
      // Валидируем простое условие
      this.validateSimpleCondition(condition);
    }
  }

  /**
   * Валидирует простое условие
   */
  private validateSimpleCondition(condition: RuleCondition): void {
    const { field, operator, value } = condition;

    // Определяем числовые поля
    const numericFields: RuleConditionField[] = [
      "fitScore",
      "resumeScore",
      "interviewScore",
      "salaryExpectation",
      "experience",
    ];

    // Определяем строковые поля
    const stringFields: RuleConditionField[] = ["availability"];

    // Определяем поля-массивы
    const arrayFields: RuleConditionField[] = ["skills"];

    // Числовые операторы
    const numericOperators: RuleConditionOperator[] = [
      ">",
      "<",
      "=",
      ">=",
      "<=",
      "!=",
    ];

    // Строковые операторы
    const stringOperators: RuleConditionOperator[] = [
      "=",
      "!=",
      "contains",
      "not_contains",
    ];

    // Операторы для массивов
    const arrayOperators: RuleConditionOperator[] = [
      "contains",
      "not_contains",
    ];

    // Валидация числовых полей
    if (numericFields.includes(field)) {
      if (!numericOperators.includes(operator)) {
        throw new Error(
          `Field "${field}" requires a numeric operator (>, <, =, >=, <=, !=), got "${operator}"`,
        );
      }

      if (typeof value !== "number") {
        throw new Error(
          `Field "${field}" requires a numeric value, got ${typeof value}`,
        );
      }

      // Дополнительная валидация для fitScore и resumeScore (0-100)
      if (
        (field === "fitScore" || field === "resumeScore") &&
        (value < 0 || value > 100)
      ) {
        throw new Error(
          `Field "${field}" must be between 0 and 100, got ${value}`,
        );
      }
    }

    // Валидация строковых полей
    if (stringFields.includes(field)) {
      if (!stringOperators.includes(operator)) {
        throw new Error(
          `Field "${field}" requires a string operator (=, !=, contains, not_contains), got "${operator}"`,
        );
      }

      if (typeof value !== "string") {
        throw new Error(
          `Field "${field}" requires a string value, got ${typeof value}`,
        );
      }

      // Валидация availability значений
      if (field === "availability") {
        const validAvailability = [
          "immediate",
          "2_weeks",
          "1_month",
          "unknown",
        ];
        if (!validAvailability.includes(value)) {
          throw new Error(
            `Field "availability" must be one of: ${validAvailability.join(", ")}, got "${value}"`,
          );
        }
      }
    }

    // Валидация полей-массивов
    if (arrayFields.includes(field)) {
      if (!arrayOperators.includes(operator)) {
        throw new Error(
          `Field "${field}" requires an array operator (contains, not_contains), got "${operator}"`,
        );
      }

      if (typeof value !== "string" && !Array.isArray(value)) {
        throw new Error(
          `Field "${field}" requires a string or array value, got ${typeof value}`,
        );
      }

      if (Array.isArray(value) && value.length === 0) {
        throw new Error(`Field "${field}" array value cannot be empty`);
      }
    }
  }

  /**
   * Валидирует действие правила
   */
  private validateAction(action: RuleAction): void {
    const { type, params } = action;

    // Валидация параметров для каждого типа действия
    switch (type) {
      case "tag":
        if (!params?.tag) {
          throw new Error(
            'Action type "tag" requires params.tag to be specified',
          );
        }
        if (typeof params.tag !== "string" || params.tag.trim() === "") {
          throw new Error(
            'Action type "tag" requires params.tag to be a non-empty string',
          );
        }
        break;

      case "notify": {
        if (!params?.notificationChannel) {
          throw new Error(
            'Action type "notify" requires params.notificationChannel to be specified',
          );
        }
        const validChannels = ["email", "telegram", "sms"];
        if (!validChannels.includes(params.notificationChannel)) {
          throw new Error(
            `Action type "notify" requires params.notificationChannel to be one of: ${validChannels.join(", ")}, got "${params.notificationChannel}"`,
          );
        }
        break;
      }

      case "invite":
      case "clarify":
        // Опциональная валидация messageTemplate
        if (params?.messageTemplate !== undefined) {
          if (
            typeof params.messageTemplate !== "string" ||
            params.messageTemplate.trim() === ""
          ) {
            throw new Error(
              `Action type "${type}" params.messageTemplate must be a non-empty string if provided`,
            );
          }
        }
        break;

      case "reject":
        // Опциональная валидация reason
        if (params?.reason !== undefined) {
          if (
            typeof params.reason !== "string" ||
            params.reason.trim() === ""
          ) {
            throw new Error(
              'Action type "reject" params.reason must be a non-empty string if provided',
            );
          }
        }
        break;

      case "pause_vacancy":
        // Нет обязательных параметров
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Удаляет правило
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Получает правило по ID
   */
  getRule(ruleId: string): AutomationRule | undefined {
    return this.rules.find((r) => r.id === ruleId);
  }

  /**
   * Получает все правила
   */
  getAllRules(): AutomationRule[] {
    return [...this.rules];
  }

  /**
   * Получает правила для workspace
   */
  getRulesForWorkspace(workspaceId: string): AutomationRule[] {
    return this.rules.filter((r) => r.workspaceId === workspaceId && r.enabled);
  }

  /**
   * Получает правила для вакансии
   */
  getRulesForVacancy(workspaceId: string, vacancyId: string): AutomationRule[] {
    return this.rules.filter(
      (r) =>
        r.workspaceId === workspaceId &&
        r.enabled &&
        (r.vacancyId === undefined || r.vacancyId === vacancyId),
    );
  }

  /**
   * Применяет правила к кандидату и возвращает результаты
   */
  applyRules(
    candidate: CandidateRuleData,
    workspaceId: string,
    vacancyId?: string,
  ): RuleApplicationResult[] {
    const applicableRules = vacancyId
      ? this.getRulesForVacancy(workspaceId, vacancyId)
      : this.getRulesForWorkspace(workspaceId);

    const results: RuleApplicationResult[] = [];

    for (const rule of applicableRules) {
      const matched = evaluateCondition(candidate, rule.condition);
      const explanation = generateExplanation(rule, matched, candidate);

      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        matched,
        action: matched ? rule.action : undefined,
        autonomyLevel: matched ? rule.autonomyLevel : undefined,
        explanation,
        timestamp: new Date(),
      });

      // Обновляем статистику
      if (matched) {
        rule.stats.triggered++;
      }
    }

    return results;
  }

  /**
   * Находит первое подходящее правило для кандидата
   */
  findMatchingRule(
    candidate: CandidateRuleData,
    workspaceId: string,
    vacancyId?: string,
  ): RuleApplicationResult | null {
    const results = this.applyRules(candidate, workspaceId, vacancyId);
    return results.find((r) => r.matched) ?? null;
  }

  /**
   * Проверяет, можно ли выполнить действие (rate limiting)
   */
  canExecuteAction(workspaceId: string): boolean {
    this.resetHourlyCounterIfNeeded();

    const currentCount = this.actionCountPerHour.get(workspaceId) ?? 0;
    return currentCount < this.config.maxActionsPerHour;
  }

  /**
   * Увеличивает счётчик действий
   */
  incrementActionCount(workspaceId: string): void {
    this.resetHourlyCounterIfNeeded();

    const currentCount = this.actionCountPerHour.get(workspaceId) ?? 0;
    this.actionCountPerHour.set(workspaceId, currentCount + 1);
  }

  /**
   * Получает текущий счётчик действий
   */
  getActionCount(workspaceId: string): number {
    this.resetHourlyCounterIfNeeded();
    return this.actionCountPerHour.get(workspaceId) ?? 0;
  }

  /**
   * Сбрасывает счётчик действий если прошёл час
   */
  private resetHourlyCounterIfNeeded(): void {
    const now = new Date();
    const hoursSinceReset =
      (now.getTime() - this.lastHourReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 1) {
      this.actionCountPerHour.clear();
      this.lastHourReset = now;
    }
  }

  /**
   * Вычисляет deadline для отмены действия
   */
  calculateUndoDeadline(): Date {
    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + this.config.undoWindowMinutes);
    return deadline;
  }

  /**
   * Обновляет конфигурацию
   */
  updateConfig(config: Partial<RuleEngineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Получает текущую конфигурацию
   */
  getConfig(): RuleEngineConfig {
    return { ...this.config };
  }

  /**
   * Включает/выключает правило
   */
  setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      rule.enabled = enabled;
      rule.updatedAt = new Date();
      return true;
    }
    return false;
  }

  /**
   * Обновляет статистику выполнения правила
   */
  updateRuleStats(
    ruleId: string,
    update:
      | Partial<AutomationRule["stats"]>
      | ((prev: AutomationRule["stats"]) => Partial<AutomationRule["stats"]>),
  ): void {
    const rule = this.rules.find((r) => r.id === ruleId);
    if (rule) {
      const statsUpdate =
        typeof update === "function" ? update(rule.stats) : update;
      rule.stats = { ...rule.stats, ...statsUpdate };
      rule.updatedAt = new Date();
    }
  }

  /**
   * Создаёт правило с дефолтными значениями
   */
  static createRule(
    params: Omit<AutomationRule, "id" | "stats" | "createdAt" | "updatedAt">,
  ): AutomationRule {
    return {
      ...params,
      id: uuidv4(),
      stats: {
        triggered: 0,
        executed: 0,
        undone: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Создаёт простое условие
   */
  static createCondition(
    field: RuleConditionField,
    operator: RuleConditionOperator,
    value: string | number | string[],
  ): RuleCondition {
    return { field, operator, value };
  }

  /**
   * Создаёт составное условие AND
   */
  static and(
    ...conditions: Array<RuleCondition | CompositeCondition>
  ): CompositeCondition {
    return { type: "AND", conditions };
  }

  /**
   * Создаёт составное условие OR
   */
  static or(
    ...conditions: Array<RuleCondition | CompositeCondition>
  ): CompositeCondition {
    return { type: "OR", conditions };
  }
}

/**
 * Pending approval request
 */
export interface PendingApproval {
  id: string;
  workspaceId: string;
  ruleId: string;
  ruleName: string;
  candidateId: string;
  action: RuleAction;
  explanation: string;
  createdAt: Date;
  expiresAt: Date;
  status: "pending" | "approved" | "rejected" | "expired";
}

/**
 * Autonomy Level Handler - управляет уровнями автономности
 */
export class AutonomyLevelHandler {
  private pendingApprovals: Map<string, PendingApproval> = new Map();
  private approvalExpirationMinutes: number;
  private cleanupIntervalId?: ReturnType<typeof setInterval>;

  constructor(approvalExpirationMinutes: number = 60) {
    this.approvalExpirationMinutes = approvalExpirationMinutes;
    // Run cleanup every 5 minutes
    this.cleanupIntervalId = setInterval(
      () => {
        this.cleanupExpired();
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Обновляет время истечения для pending approvals
   */
  setApprovalExpirationMinutes(minutes: number): void {
    this.approvalExpirationMinutes = minutes;
  }

  /**
   * Получает текущее время истечения для pending approvals
   */
  getApprovalExpirationMinutes(): number {
    return this.approvalExpirationMinutes;
  }

  /**
   * Определяет статус выполнения на основе уровня автономности
   */
  determineExecutionStatus(
    autonomyLevel: AutonomyLevel,
  ): "executed" | "pending_approval" | "advised" {
    switch (autonomyLevel) {
      case "autonomous":
        return "executed";
      case "confirm":
        return "pending_approval";
      default:
        return "advised";
    }
  }

  /**
   * Проверяет, требуется ли подтверждение для уровня автономности
   */
  requiresApproval(autonomyLevel: AutonomyLevel): boolean {
    return autonomyLevel === "confirm";
  }

  /**
   * Проверяет, можно ли выполнить действие автоматически
   */
  canExecuteAutomatically(autonomyLevel: AutonomyLevel): boolean {
    return autonomyLevel === "autonomous";
  }

  /**
   * Проверяет, является ли уровень только рекомендательным
   */
  isAdviseOnly(autonomyLevel: AutonomyLevel): boolean {
    return autonomyLevel === "advise";
  }

  /**
   * Создаёт запрос на подтверждение
   */
  createPendingApproval(
    ruleId: string,
    ruleName: string,
    candidateId: string,
    action: RuleAction,
    explanation: string,
    workspaceId: string,
  ): PendingApproval {
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMinutes(
      expiresAt.getMinutes() + this.approvalExpirationMinutes,
    );

    const approval: PendingApproval = {
      id: uuidv4(),
      workspaceId,
      ruleId,
      ruleName,
      candidateId,
      action,
      explanation,
      createdAt: now,
      expiresAt,
      status: "pending",
    };

    this.pendingApprovals.set(approval.id, approval);
    return approval;
  }

  /**
   * Получает pending approval по ID
   */
  getPendingApproval(approvalId: string): PendingApproval | undefined {
    const approval = this.pendingApprovals.get(approvalId);
    if (approval && this.isExpired(approval)) {
      approval.status = "expired";
      this.pendingApprovals.delete(approvalId);
      return undefined;
    }
    return approval;
  }

  /**
   * Получает все pending approvals для workspace
   */
  getPendingApprovals(workspaceId?: string): PendingApproval[] {
    this.cleanupExpired();
    const pendingApprovals = Array.from(this.pendingApprovals.values()).filter(
      (a) => a.status === "pending",
    );

    if (workspaceId) {
      return pendingApprovals.filter((a) => a.workspaceId === workspaceId);
    }

    return pendingApprovals;
  }

  /**
   * Одобряет pending approval
   */
  approve(approvalId: string): PendingApproval | null {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return null;
    }

    if (this.isExpired(approval)) {
      approval.status = "expired";
      return null;
    }

    if (approval.status !== "pending") {
      return null;
    }

    approval.status = "approved";
    return approval;
  }

  /**
   * Отклоняет pending approval
   */
  reject(approvalId: string): PendingApproval | null {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return null;
    }

    if (this.isExpired(approval)) {
      approval.status = "expired";
      return null;
    }

    if (approval.status !== "pending") {
      return null;
    }

    approval.status = "rejected";
    return approval;
  }

  /**
   * Проверяет, истёк ли срок approval
   */
  private isExpired(approval: PendingApproval): boolean {
    return new Date() > approval.expiresAt;
  }

  /**
   * Очищает истёкшие approvals
   */
  private cleanupExpired(): void {
    for (const [id, approval] of this.pendingApprovals) {
      if (this.isExpired(approval)) {
        approval.status = "expired";
        this.pendingApprovals.delete(id);
      }
    }
  }

  /**
   * Удаляет approval
   */
  removeApproval(approvalId: string): boolean {
    return this.pendingApprovals.delete(approvalId);
  }

  /**
   * Очищает все approvals
   */
  clearAll(): void {
    this.pendingApprovals.clear();
  }

  /**
   * Останавливает периодическую очистку (для тестов и cleanup)
   */
  destroy(): void {
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = undefined;
    }
  }
}

/**
 * Singleton instance для использования в приложении
 */
let ruleEngineInstance: RuleEngine | null = null;
let autonomyHandlerInstance: AutonomyLevelHandler | null = null;

export function getRuleEngine(config?: Partial<RuleEngineConfig>): RuleEngine {
  if (!ruleEngineInstance) {
    ruleEngineInstance = new RuleEngine(config);
  } else if (config) {
    ruleEngineInstance.updateConfig(config);
  }
  return ruleEngineInstance;
}

export function getAutonomyHandler(
  approvalExpirationMinutes?: number,
): AutonomyLevelHandler {
  if (!autonomyHandlerInstance) {
    autonomyHandlerInstance = new AutonomyLevelHandler(
      approvalExpirationMinutes,
    );
  } else if (approvalExpirationMinutes !== undefined) {
    // Update the expiration time if a new value is provided
    autonomyHandlerInstance.setApprovalExpirationMinutes(
      approvalExpirationMinutes,
    );
  }
  return autonomyHandlerInstance;
}

/**
 * Сбрасывает singleton (для тестов)
 */
export function resetRuleEngine(): void {
  ruleEngineInstance = null;
}

/**
 * Сбрасывает autonomy handler (для тестов)
 */
export function resetAutonomyHandler(): void {
  if (autonomyHandlerInstance) {
    autonomyHandlerInstance.destroy();
  }
  autonomyHandlerInstance = null;
}
