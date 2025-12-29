import {
  FREELANCE_CONFIGS,
  normalizeFreelanceVacancy,
  type RawFreelanceVacancy,
} from "../freelance";
import type { VacancyData } from "../types";

/**
 * Парсит вакансии с Weblancer
 */
export async function parseWeblancerVacancies(
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS.weblancer;

  console.log(`🚀 Парсинг вакансий с ${config.name}`);

  const vacancies = rawVacancies.map((raw) =>
    normalizeFreelanceVacancy(raw, "weblancer"),
  );

  return vacancies;
}
