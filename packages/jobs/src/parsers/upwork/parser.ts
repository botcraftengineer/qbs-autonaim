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

  const vacancies: VacancyData[] = [];

  for (const raw of rawVacancies) {
    try {
      const normalized = normalizeFreelanceVacancy(raw, "upwork");
      vacancies.push(normalized);
    } catch (error) {
      const vacancyId = raw.id || "unknown";
      const vacancyTitle = raw.title || "no title";
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(
        `❌ Ошибка при нормализации вакансии [ID: ${vacancyId}, Title: "${vacancyTitle}"]:`,
        errorMessage,
        errorStack ? `\nStack: ${errorStack}` : "",
      );
    }
  }

  console.log(
    `✅ Успешно обработано ${vacancies.length} из ${rawVacancies.length} вакансий`,
  );

  return vacancies;
}
