import {
  FREELANCE_CONFIGS,
  normalizeFreelanceVacancy,
  type RawFreelanceVacancy,
} from "../freelance";
import type { VacancyData } from "../types";

/**
 * Парсит вакансии с FL.ru
 */
export async function parseFlVacancies(
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS.fl;

  console.log(`🚀 Парсинг вакансий с ${config.name}`);

  const vacancies = rawVacancies.map((raw) =>
    normalizeFreelanceVacancy(raw, "fl"),
  );

  return vacancies;
}
