/**
 * Промпты для скрининга откликов и резюме
 */

import { extractFirstName } from "./utils/name-extractor";

export interface VacancyRequirements {
  job_title: string;
  summary: string;
  mandatory_requirements: string[];
  nice_to_have_skills: string[];
  tech_stack: string[];
  experience_years: {
    min: number | null;
    description: string;
  };
  languages: Array<{
    language: string;
    level: string;
  }>;
  location_type: string;
  keywords_for_matching: string[];
}

export interface ResponseData {
  candidateName: string | null;
  experience: string | null;
  coverLetter?: string | null;
}

/**
 * Промпт для скрининга отклика кандидата
 */
export function buildResponseScreeningPrompt(
  response: ResponseData,
  requirements: VacancyRequirements,
  customPrompt?: string | null,
): string {
  const basePrompt = `Ты — эксперт по подбору персонала. Оцени соответствие резюме кандидата требованиям вакансии.`;

  const customInstructions = customPrompt
    ? `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РЕКРУТЕРА:\n${customPrompt}\n`
    : "";

  return `${basePrompt}${customInstructions}

ТРЕБОВАНИЯ ВАКАНСИИ:
Позиция: ${requirements.job_title}
Описание: ${requirements.summary}

Обязательные требования:
${requirements.mandatory_requirements.map((r) => `- ${r}`).join("\n")}

Желательные навыки:
${requirements.nice_to_have_skills.map((s) => `- ${s}`).join("\n")}

Технологический стек: ${requirements.tech_stack.join(", ")}

Опыт: ${requirements.experience_years.description}

Языки: ${requirements.languages.map((l) => `${l.language} (${l.level})`).join(", ")}

РЕЗЮМЕ КАНДИДАТА:
Имя: ${extractFirstName(response.candidateName)}

Опыт работы:
${response.experience || "Не указан"}
${response.coverLetter ? `\nСопроводительное письмо:\n${response.coverLetter}` : ""}

ЗАДАЧА:
1. Определи язык резюме (ru, en, de, fr, es, it, pt, pl, tr и т.д.) на основе текста опыта работы и сопроводительного письма. Если язык не может быть определен или текст недостаточен, используй 'ru'.

2. Оцени соответствие резюме требованиям по двум шкалам:
   
   a) Общая оценка (score) от 0 до 5:
   - 0: Абсолютно не подходит (спам, нерелевантный опыт)
   - 1: Критическое несоответствие
   - 2: Слабое соответствие
   - 3: Среднее соответствие
   - 4: Хорошее соответствие
   - 5: Отличное соответствие
   
   b) Детальная оценка (detailedScore) от 0 до 100:
   - Более точная оценка для определения победителя среди кандидатов
   - Учитывай все нюансы: опыт, навыки, образование, языки, мотивацию
   - Эта оценка поможет ранжировать кандидатов с одинаковым score

3. Напиши краткий анализ (2-3 предложения): что подходит, чего не хватает.

ФОРМАТ ОТВЕТА (JSON):
Верни ответ СТРОГО в формате валидного JSON без Markdown-разметки.

{
  "score": число от 0 до 5,
  "detailedScore": число от 0 до 100,
  "analysis": "Краткий анализ соответствия в формате HTML. Используй теги: <p> для абзацев, <strong> для выделения, <ul>/<li> для списков, <br> для переносов строк",
  "resumeLanguage": "код языка резюме в формате ISO 639-1 (ru, en, de, fr, es, it, pt, pl, tr и т.д.)"
}`;
}

export interface ResumeScreeningData {
  experience: string;
  skills?: string;
}

/**
 * Форматирует данные резюме для скрининга
 */
export function formatResumeForScreening(
  resumeData: ResumeScreeningData,
): string {
  const sections: string[] = [];

  sections.push(`ОПЫТ РАБОТЫ:\n${resumeData.experience}`);

  if (resumeData.skills) {
    sections.push(`\nНАВЫКИ:\n${resumeData.skills}`);
  }

  return sections.join("\n");
}

/**
 * Создает полный промпт для скрининга резюме
 */
export function buildFullResumeScreeningPrompt(
  requirements: VacancyRequirements,
  resumeData: ResumeScreeningData,
  customPrompt?: string | null,
): string {
  const formattedResume = formatResumeForScreening(resumeData);

  const basePrompt = `Ты эксперт по подбору персонала. Оцени резюме кандидата на соответствие требованиям вакансии.`;

  const customInstructions = customPrompt
    ? `\n\nДОПОЛНИТЕЛЬНЫЕ ИНСТРУКЦИИ ОТ РЕКРУТЕРА:\n${customPrompt}\n`
    : "";

  return `${basePrompt}${customInstructions}

ВАКАНСИЯ: ${requirements.job_title}

ОПИСАНИЕ: ${requirements.summary}

ОБЯЗАТЕЛЬНЫЕ ТРЕБОВАНИЯ:
${requirements.mandatory_requirements.map((r, i) => `${i + 1}. ${r}`).join("\n")}

ЖЕЛАТЕЛЬНЫЕ НАВЫКИ:
${requirements.nice_to_have_skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

ТЕХНОЛОГИИ: ${requirements.tech_stack.join(", ")}

ОПЫТ: ${requirements.experience_years.description}

ЯЗЫКИ: ${requirements.languages.map((l) => `${l.language} (${l.level})`).join(", ")}

ЛОКАЦИЯ: ${requirements.location_type}

РЕЗЮМЕ КАНДИДАТА:

${formattedResume}

ФОРМАТ ОТВЕТА (только JSON):
{
  "match_percentage": число от 0 до 100,
  "recommendation": "invite" | "reject" | "need_info",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1", "слабая сторона 2"],
  "summary": "краткое резюме в формате HTML. Используй теги: <p> для абзацев, <strong> для выделения, <ul>/<li> для списков, <br> для переносов строк"
}`;
}
