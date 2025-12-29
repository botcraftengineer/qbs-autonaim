import { parseFlVacancies } from "./fl";
import type { RawFreelanceVacancy } from "./freelance";
import { FREELANCE_SOURCES, type FreelanceSource } from "./freelance/types";
import { parseKworkVacancies } from "./kwork";
import type { VacancyData } from "./types";
import { parseUpworkVacancies } from "./upwork";
import { parseWeblancerVacancies } from "./weblancer";

/**
 * Список поддерживаемых источников вакансий
 */
export const VACANCY_SOURCES = [
  "hh",
  "avito",
  "superjob",
  "kwork",
  "fl",
  "weblancer",
  "upwork",
] as const;

/**
 * Тип источника вакансии
 */
export type VacancySource = (typeof VACANCY_SOURCES)[number];

/**
 * Парсит вакансии в зависимости от источника
 */
export async function parseVacanciesBySource(
  source: VacancySource,
  rawData: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  switch (source) {
    case "kwork":
      return parseKworkVacancies(rawData);
    case "fl":
      return parseFlVacancies(rawData);
    case "weblancer":
      return parseWeblancerVacancies(rawData);
    case "upwork":
      return parseUpworkVacancies(rawData);
    case "hh":
    case "avito":
    case "superjob":
      throw new Error(
        `Парсер для ${source} должен вызываться напрямую, а не через диспетчер`,
      );
    default:
      throw new Error(`Неизвестный источник вакансий: ${source}`);
  }
}

/**
 * Проверяет, поддерживается ли источник
 */
export function isVacancySourceSupported(
  source: string,
): source is VacancySource {
  return VACANCY_SOURCES.includes(source as VacancySource);
}

/**
 * Проверяет, является ли источник фриланс-платформой
 */
export function isFreelancePlatform(
  source: VacancySource,
): source is FreelanceSource {
  return FREELANCE_SOURCES.includes(source as FreelanceSource);
}
