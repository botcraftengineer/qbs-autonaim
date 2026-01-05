/**
 * Company Settings Loader для AI-ассистента рекрутера
 *
 * Централизованная загрузка настроек компании из БД
 * для использования во всех агентах.
 *
 * Requirements: 7.5 - THE AI_Agent SHALL адаптировать стиль общения под настройки компании
 */

import type { CompanySettingsData } from "./context";
import type { RecruiterCompanySettings } from "./types";

/**
 * Результат загрузки настроек компании из БД
 */
export interface CompanySettingsFromDB {
  id: string;
  workspaceId: string;
  name: string;
  website?: string | null;
  description?: string | null;
  botName?: string | null;
  botRole?: string | null;
  onboardingCompleted?: boolean | null;
}

/**
 * Преобразует данные из БД в формат CompanySettingsData
 *
 * @param dbSettings - Настройки из БД (может быть null/undefined)
 * @returns CompanySettingsData для использования в контексте
 */
export function mapDBSettingsToCompanyData(
  dbSettings: CompanySettingsFromDB | null | undefined,
): CompanySettingsData | null {
  if (!dbSettings) {
    return null;
  }

  return {
    name: dbSettings.name,
    description: dbSettings.description,
    website: dbSettings.website,
    botName: dbSettings.botName,
    botRole: dbSettings.botRole,
  };
}

/**
 * Преобразует данные из БД в формат RecruiterCompanySettings
 *
 * @param dbSettings - Настройки из БД (может быть null/undefined)
 * @param defaults - Значения по умолчанию
 * @returns RecruiterCompanySettings для использования в агентах
 */
export function mapDBSettingsToRecruiterSettings(
  dbSettings: CompanySettingsFromDB | null | undefined,
  defaults: Partial<RecruiterCompanySettings> = {},
): RecruiterCompanySettings {
  return {
    name: dbSettings?.name ?? defaults.name ?? "Компания",
    description: dbSettings?.description ?? defaults.description ?? undefined,
    botName: dbSettings?.botName ?? defaults.botName ?? "AI-ассистент",
    botRole: dbSettings?.botRole ?? defaults.botRole ?? "рекрутер",
    communicationStyle: defaults.communicationStyle ?? "professional",
    defaultAutonomyLevel: defaults.defaultAutonomyLevel ?? "advise",
  };
}

/**
 * Значения по умолчанию для настроек компании
 */
export const DEFAULT_COMPANY_SETTINGS: RecruiterCompanySettings = {
  name: "Компания",
  botName: "AI-ассистент",
  botRole: "рекрутер",
  communicationStyle: "professional",
  defaultAutonomyLevel: "advise",
};

/**
 * Проверяет, настроены ли кастомные настройки бота
 *
 * @param settings - Настройки компании
 * @returns true если настройки кастомизированы
 */
export function hasCustomBotSettings(
  settings: RecruiterCompanySettings | null | undefined,
): boolean {
  if (!settings) {
    return false;
  }

  return (
    (settings.botName !== undefined &&
      settings.botName !== DEFAULT_COMPANY_SETTINGS.botName) ||
    (settings.botRole !== undefined &&
      settings.botRole !== DEFAULT_COMPANY_SETTINGS.botRole)
  );
}

/**
 * Генерирует строку представления бота для использования в промптах
 *
 * @param settings - Настройки компании
 * @returns Строка вида "Имя (роль)"
 */
export function getBotIdentity(
  settings: RecruiterCompanySettings | null | undefined,
): string {
  const botName = settings?.botName ?? DEFAULT_COMPANY_SETTINGS.botName;
  const botRole = settings?.botRole ?? DEFAULT_COMPANY_SETTINGS.botRole;

  return `${botName} (${botRole})`;
}

/**
 * Генерирует контекст компании для включения в промпт агента
 *
 * @param settings - Настройки компании
 * @returns Форматированная строка для промпта
 */
export function generateCompanyContextForPrompt(
  settings: RecruiterCompanySettings | null | undefined,
): string {
  const name = settings?.name ?? DEFAULT_COMPANY_SETTINGS.name;
  const botName = settings?.botName ?? DEFAULT_COMPANY_SETTINGS.botName;
  const botRole = settings?.botRole ?? DEFAULT_COMPANY_SETTINGS.botRole;
  const style = settings?.communicationStyle ?? "professional";

  const lines = [
    "Настройки компании:",
    `- Название компании: ${name}`,
    `- Имя бота: ${botName}`,
    `- Роль бота: ${botRole}`,
    `- Стиль коммуникации: ${style}`,
  ];

  if (settings?.description) {
    lines.push(`- Описание: ${settings.description}`);
  }

  return lines.join("\n");
}

/**
 * Валидирует настройки компании
 *
 * @param settings - Настройки для валидации
 * @returns Объект с результатом валидации и ошибками
 */
export function validateCompanySettings(settings: RecruiterCompanySettings): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!settings.name || settings.name.trim().length === 0) {
    errors.push("Название компании обязательно");
  }

  if (settings.botName && settings.botName.length > 50) {
    errors.push("Имя бота не должно превышать 50 символов");
  }

  if (settings.botRole && settings.botRole.length > 100) {
    errors.push("Роль бота не должна превышать 100 символов");
  }

  if (
    settings.communicationStyle &&
    !["formal", "casual", "professional"].includes(settings.communicationStyle)
  ) {
    errors.push(
      "Стиль коммуникации должен быть: formal, casual или professional",
    );
  }

  if (
    settings.defaultAutonomyLevel &&
    !["advise", "confirm", "autonomous"].includes(settings.defaultAutonomyLevel)
  ) {
    errors.push(
      "Уровень автономности должен быть: advise, confirm или autonomous",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
