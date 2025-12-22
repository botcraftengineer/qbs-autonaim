// Vacancy repository operations

// Re-export base utilities for convenience
export { unwrap } from "../base";
export {
  checkVacancyExists,
  getVacanciesWithoutDescription,
  getVacancyById,
  hasVacancyDescription,
  saveBasicVacancy,
  saveVacancyToDb,
  updateVacancyDescription,
} from "./vacancy-repository";
// Vacancy requirements
export {
  extractVacancyRequirements,
  getVacancyRequirements,
} from "./vacancy-requirements";
