import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Унифицированные enum'ы для всех типов откликов (gig, vacancy, project)
 */

/**
 * Статус отклика
 */
export const responseStatusEnum = pgEnum("response_status", [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
]);

export const responseStatusValues = [
  "NEW",
  "EVALUATED",
  "INTERVIEW",
  "NEGOTIATION",
  "COMPLETED",
  "SKIPPED",
] as const;

export type ResponseStatus = (typeof responseStatusValues)[number];

/**
 * HR статус отбора
 */
export const hrSelectionStatusEnum = pgEnum("hr_selection_status", [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "ONBOARDING",
  "DONE",
]);

export const hrSelectionStatusValues = [
  "INVITE",
  "RECOMMENDED",
  "NOT_RECOMMENDED",
  "REJECTED",
  "SELECTED",
  "OFFER",
  "SECURITY_PASSED",
  "CONTRACT_SENT",
  "IN_PROGRESS",
  "ONBOARDING",
  "DONE",
] as const;

export type HrSelectionStatus = (typeof hrSelectionStatusValues)[number];

/**
 * Источник импорта отклика
 */
export const importSourceEnum = pgEnum("import_source", [
  "MANUAL",
  "KWORK",
  "FL_RU",
  "WEBLANCER",
  "UPWORK",
  "FREELANCE_RU",
  "HH_API",
  "WEB_LINK",
]);

export const importSourceValues = [
  "MANUAL",
  "KWORK",
  "FL_RU",
  "WEBLANCER",
  "UPWORK",
  "FREELANCE_RU",
  "HH_API",
  "WEB_LINK",
] as const;

export type ImportSource = (typeof importSourceValues)[number];

/**
 * Рекомендация по кандидату
 */
export const recommendationEnum = pgEnum("recommendation", [
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
]);

export const recommendationValues = [
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
] as const;

export type Recommendation = (typeof recommendationValues)[number];
