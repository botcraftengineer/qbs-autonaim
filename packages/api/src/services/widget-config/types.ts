/**
 * Widget Config Service Types
 *
 * Типы для сервиса управления конфигурацией виджета преквалификации.
 * Основные типы данных реэкспортируются из схемы БД для обеспечения консистентности.
 */

// Re-export core types from DB schema for consistency
export type {
  HonestyLevel,
  WidgetConfig,
  WidgetTone,
} from "@qbs-autonaim/db";

/**
 * Конфигурация брендинга виджета
 */
export interface BrandingConfig {
  /** URL логотипа компании */
  logo?: string | null;
  /** Основной цвет (hex) */
  primaryColor: string;
  /** Вторичный цвет (hex) */
  secondaryColor: string;
  /** Цвет фона (hex) */
  backgroundColor: string;
  /** Цвет текста (hex) */
  textColor: string;
  /** Семейство шрифтов */
  fontFamily: string;
  /** Имя AI ассистента */
  assistantName: string;
  /** URL аватара ассистента */
  assistantAvatar?: string | null;
  /** Приветственное сообщение */
  welcomeMessage?: string | null;
  /** Сообщение при завершении */
  completionMessage?: string | null;
}

/**
 * Конфигурация поведения виджета
 */
export interface BehaviorConfig {
  /** Порог прохождения (0-100) */
  passThreshold: number;
  /** Обязательные вопросы */
  mandatoryQuestions: string[];
  /** Тон общения */
  tone: "formal" | "friendly";
  /** Уровень честности в обратной связи */
  honestyLevel: "direct" | "diplomatic" | "encouraging";
  /** Максимальное количество сообщений в диалоге */
  maxDialogueTurns: number;
  /** Таймаут сессии в минутах */
  sessionTimeoutMinutes: number;
}

/**
 * Юридическая конфигурация виджета
 */
export interface LegalConfig {
  /** Текст согласия на обработку данных */
  consentText?: string | null;
  /** Текст дисклеймера */
  disclaimerText?: string | null;
  /** URL политики конфиденциальности */
  privacyPolicyUrl?: string | null;
  /** Срок хранения данных в днях */
  dataRetentionDays: number;
}

/**
 * Полная конфигурация виджета
 */
export interface WidgetConfiguration {
  /** ID конфигурации */
  id: string;
  /** ID workspace (tenant) */
  workspaceId: string;
  /** Настройки брендинга */
  branding: BrandingConfig;
  /** Настройки поведения */
  behavior: BehaviorConfig;
  /** Юридические настройки */
  legal: LegalConfig;
  /** Дата создания */
  createdAt: Date;
  /** Дата обновления */
  updatedAt: Date;
}

/**
 * Входные данные для обновления конфигурации виджета
 */
export interface UpdateWidgetConfigInput {
  /** Настройки брендинга (частичное обновление) */
  branding?: Partial<BrandingConfig>;
  /** Настройки поведения (частичное обновление) */
  behavior?: Partial<BehaviorConfig>;
  /** Юридические настройки (частичное обновление) */
  legal?: Partial<LegalConfig>;
}

/**
 * Коды ошибок сервиса конфигурации виджета
 */
export type WidgetConfigErrorCode =
  | "CONFIG_NOT_FOUND"
  | "TENANT_MISMATCH"
  | "INVALID_CONFIG"
  | "VALIDATION_FAILED"
  | "DATABASE_ERROR";

/**
 * Ошибка сервиса конфигурации виджета
 */
export class WidgetConfigError extends Error {
  readonly code: WidgetConfigErrorCode;
  readonly userMessage: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: WidgetConfigErrorCode,
    userMessage: string,
    details?: Record<string, unknown>,
  ) {
    super(`[${code}] ${userMessage}`);
    this.name = "WidgetConfigError";
    this.code = code;
    this.userMessage = userMessage;
    this.details = details;
  }
}

/**
 * Значения по умолчанию для брендинга
 */
export const DEFAULT_BRANDING: BrandingConfig = {
  logo: null,
  primaryColor: "#3B82F6",
  secondaryColor: "#1E40AF",
  backgroundColor: "#FFFFFF",
  textColor: "#1F2937",
  fontFamily: "Inter",
  assistantName: "ИИ Ассистент",
  assistantAvatar: null,
  welcomeMessage: null,
  completionMessage: null,
};

/**
 * Значения по умолчанию для поведения
 */
export const DEFAULT_BEHAVIOR: BehaviorConfig = {
  passThreshold: 60,
  mandatoryQuestions: [],
  tone: "friendly",
  honestyLevel: "diplomatic",
  maxDialogueTurns: 10,
  sessionTimeoutMinutes: 30,
};

/**
 * Значения по умолчанию для юридических настроек
 */
export const DEFAULT_LEGAL: LegalConfig = {
  consentText: null,
  disclaimerText: null,
  privacyPolicyUrl: null,
  dataRetentionDays: 90,
};
