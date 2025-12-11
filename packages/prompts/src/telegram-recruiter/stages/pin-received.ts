import { stripHtml } from "string-strip-html";
import type { TelegramRecruiterContext } from "../types";

/**
 * Промпт для этапа получения PIN-кода (начало интервью)
 */
export function buildPinReceivedPrompt(
  context: TelegramRecruiterContext,
): string {
  const { vacancyTitle, vacancyRequirements, resumeData } = context;

  const experienceContext = resumeData?.experience
    ? `\nОпыт из резюме: ${stripHtml(resumeData.experience).result}`
    : "";
  const coverLetterContext = resumeData?.coverLetter
    ? `\nСопроводительное письмо: ${resumeData.coverLetter}`
    : "";
  const requirementsContext = vacancyRequirements
    ? `\nТребования к вакансии: ${vacancyRequirements}`
    : "";

  const hasExperience =
    resumeData?.experience && resumeData.experience.length > 50;
  const hasCoverLetter =
    resumeData?.coverLetter && resumeData.coverLetter.length > 20;
  const hasRequirements =
    vacancyRequirements && vacancyRequirements.length > 20;

  let suggestedQuestions = "";
  if (hasExperience && hasCoverLetter && hasRequirements) {
    suggestedQuestions = `
РЕКОМЕНДУЕМЫЕ ВОПРОСЫ (выбери 2 наиболее релевантных, учитывая требования):
- Расскажите подробнее о вашем опыте с [ключевые технологии из требований]
- Что вас привлекло в нашей вакансии?
- Какие ожидания по зарплате?
- Когда готовы приступить к работе?`;
  } else if (hasExperience && hasRequirements) {
    suggestedQuestions = `
РЕКОМЕНДУЕМЫЕ ВОПРОСЫ (выбери 2, проверяя соответствие требованиям):
- Расскажите о своем опыте работы с [технологии из требований]
- Почему интересна эта позиция?
- Ожидания по зарплате?`;
  } else if (hasExperience) {
    suggestedQuestions = `
РЕКОМЕНДУЕМЫЕ ВОПРОСЫ (выбери 2):
- Расскажите о своем опыте работы
- Почему интересна эта позиция?
- Ожидания по зарплате?`;
  } else {
    suggestedQuestions = `
РЕКОМЕНДУЕМЫЕ ВОПРОСЫ (выбери 2):
- Расскажите о себе и своем опыте
- Что привлекло в вакансии ${vacancyTitle || ""}?
- Какие у вас ожидания?`;
  }

  return `
⚠️ ЭТАП 2: PIN-КОД ПОЛУЧЕН — НАЧАЛО ИНТЕРВЬЮ
Кандидат только что отправил PIN-код и идентифицирован. Начинаем интервью.

СТРОГОЕ ПРАВИЛО ПРИВЕТСТВИЯ:
- ЗАПРЕЩЕНО использовать слово "Привет"
- ОБЯЗАТЕЛЬНО используй только "Добрый день" или "Здравствуйте"

КОНТЕКСТ О КАНДИДАТЕ (используй для персонализации вопросов):
${vacancyTitle ? `Вакансия: ${vacancyTitle}` : "Вакансия не указана"}${requirementsContext}${experienceContext}${coverLetterContext}

ТВОЯ ЗАДАЧА:
- Поприветствуй кандидата естественно
- САМОСТОЯТЕЛЬНО определи имя кандидата из его предыдущих сообщений (если он представился)
- Если имя есть в переписке - обращайся по имени, если нет - просто "Здравствуйте"
- НЕ упоминай PIN-код, проверку или систему идентификации
- Попроси записать голосовое сообщение (это важно для интервью)
- Задай 2 конкретных вопроса, релевантных его опыту и вакансии
- Пиши коротко и по-человечески, без излишней восторженности
${suggestedQuestions}

ПРИМЕРЫ ХОРОШИХ СООБЩЕНИЙ:
"Добрый день! Запишите голосовое — расскажите о своем опыте и почему заинтересовала позиция"
"Здравствуйте! Давайте познакомимся. Запишите голосовое: расскажите о вашем опыте и что привлекло в вакансии"

ВАЖНО: 
- Сообщение должно быть коротким (2-3 предложения максимум) и естественным
- Используй имя ТОЛЬКО если кандидат сам представился в своих сообщениях
- НЕ используй имя из базы данных - только из контекста переписки`;
}
