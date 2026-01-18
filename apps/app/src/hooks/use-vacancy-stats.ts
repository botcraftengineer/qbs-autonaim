import { useMemo } from "react";

interface Vacancy {
  isActive: boolean;
  totalResponsesCount: number | null;
  newResponses: number | null;
}

export function useVacancyStats(vacancies: Vacancy[] | undefined) {
  return useMemo(() => {
    if (!vacancies) {
      return {
        totalVacancies: 0,
        activeVacancies: 0,
        totalResponses: 0,
        newResponses: 0,
      };
    }

    return {
      totalVacancies: vacancies.length,
      activeVacancies: vacancies.filter((v) => v.isActive).length,
      totalResponses: vacancies.reduce(
        (sum, v) => sum + (v.totalResponsesCount ?? 0),
        0,
      ),
      newResponses: vacancies.reduce(
        (sum, v) => sum + (v.newResponses ?? 0),
        0,
      ),
    };
  }, [vacancies]);
}
