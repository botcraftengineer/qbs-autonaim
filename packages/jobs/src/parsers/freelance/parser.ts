import type { VacancyData } from "../types";
import { FREELANCE_CONFIGS } from "./config";
import type { FreelanceSource, RawFreelanceVacancy } from "./types";

/**
 * Нормализует сырые данные фриланс-вакансии в формат VacancyData
 */
export function normalizeFreelanceVacancy(
  raw: RawFreelanceVacancy,
  source: FreelanceSource,
): VacancyData {
  return {
    id: raw.id,
    externalId: raw.id,
    source,
    title: raw.title,
    url: raw.url,
    views: "0",
    responses: "0",
    responsesUrl: null,
    newResponses: "0",
    resumesInProgress: "0",
    suitableResumes: "0",
    region: raw.category || "",
    description: raw.description || "",
  };
}

/**
 * Парсит вакансии с фриланс-платформы
 */
export async function parseFreelanceVacancies(
  source: FreelanceSource,
  rawVacancies: RawFreelanceVacancy[],
): Promise<VacancyData[]> {
  const config = FREELANCE_CONFIGS[source];

  console.log(`🚀 Парсинг вакансий с ${config.name}`);
  console.log(`   Найдено вакансий: ${rawVacancies.length}`);

  const vacancies = rawVacancies.map((raw) =>
    normalizeFreelanceVacancy(raw, source),
  );

  console.log(`✅ Обработано вакансий: ${vacancies.length}`);

  return vacancies;
}

/**
 * Создает заглушку для вакансии с минимальными данными
 */
export function createFreelanceVacancyStub(
  id: string,
  title: string,
  source: FreelanceSource,
): VacancyData {
  const config = FREELANCE_CONFIGS[source];

  return {
    id,
    externalId: id,
    source,
    title,
    url: `${config.baseUrl}/project/${id}`,
    views: "0",
    responses: "0",
    responsesUrl: null,
    newResponses: "0",
    resumesInProgress: "0",
    suitableResumes: "0",
    region: "",
    description: "",
  };
}
