import {
  FREELANCE_CONFIGS,
  normalizeFreelanceVacancy,
  type RawFreelanceVacancy,
} from "../freelance";
import type { VacancyData } from "../types";

/**
 * Парсит вакансии с Upwork
 */
export async function parseUpworkVacancies(
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS.upwork;

  console.log(`🚀 Парсинг вакансий с ${config.name}`);

  const vacancies = rawVacancies.map((raw) =>
    normalizeFreelanceVacancy(raw, "upwork"),
  );

  return vacancies;
}
