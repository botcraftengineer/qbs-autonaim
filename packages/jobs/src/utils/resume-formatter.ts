import type { ResumeScreeningData } from "../types/screening";

/**
 * Форматирует данные резюме для отправки в промпт скрининга
 */
export function formatResumeForScreening(
  resumeData: ResumeScreeningData
): string {
  const sections: string[] = [];

  // Опыт работы (обязательное поле)
  sections.push(`ОПЫТ РАБОТЫ:\n${resumeData.experience}`);

  // Образование
  if (resumeData.education) {
    sections.push(`\nОБРАЗОВАНИЕ:\n${resumeData.education}`);
  }

  // Навыки
  if (resumeData.skills) {
    sections.push(`\nНАВЫКИ:\n${resumeData.skills}`);
  }

  // О себе
  if (resumeData.about) {
    sections.push(`\nО СЕБЕ:\n${resumeData.about}`);
  }

  // Языки
  if (resumeData.languages) {
    sections.push(`\nЯЗЫКИ:\n${resumeData.languages}`);
  }

  // Курсы и сертификаты
  if (resumeData.courses) {
    sections.push(`\nКУРСЫ И СЕРТИФИКАТЫ:\n${resumeData.courses}`);
  }

  return sections.join("\n");
}

/**
 * Создает полный промпт для скрининга, объединяя промпт вакансии и данные резюме
 */
export function buildFullScreeningPrompt(
  vacancyPrompt: string,
  resumeData: ResumeScreeningData
): string {
  const formattedResume = formatResumeForScreening(resumeData);

  return `${vacancyPrompt}

РЕЗЮМЕ КАНДИДАТА:

${formattedResume}`;
}
