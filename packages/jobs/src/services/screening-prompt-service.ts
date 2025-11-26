import { deepseek } from "@ai-sdk/deepseek";
import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { vacancy } from "@selectio/db/schema";
import { generateText } from "ai";
import { vacancyRequirementsSchema } from "../schemas/vacancy-requirements.schema";
import type { VacancyRequirements } from "../types/screening";
import { extractJsonFromText } from "../utils/json-extractor";

/**
 * Извлекает и структурирует требования вакансии через AI
 */
export async function extractVacancyRequirements(
  vacancyId: string,
  description: string
): Promise<VacancyRequirements> {
  console.log(`🎯 Генерация требований для вакансии ${vacancyId}`);

  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  if (!vacancyData) {
    throw new Error(`Вакансия ${vacancyId} не найдена`);
  }

  const prompt = buildExtractionPrompt(vacancyData.title, description);

  console.log(`📤 Отправка запроса в AI для извлечения требований`);

  const { text } = await generateText({
    model: deepseek("deepseek-chat"),
    prompt,
    temperature: 0.1,
    experimental_telemetry: { isEnabled: true },
  });

  console.log(`📥 Получен ответ от AI`);

  const requirements = parseRequirements(text);

  await db
    .update(vacancy)
    .set({ requirements })
    .where(eq(vacancy.id, vacancyId));

  console.log(`✅ Требования сохранены для вакансии ${vacancyId}`);

  return requirements;
}

function buildExtractionPrompt(title: string, description: string): string {
  return `Ты — эксперт по Talent Acquisition и HR-аналитике. Твоя задача — проанализировать текст вакансии и структурировать его в формат JSON для использования в системе автоматического скрининга резюме (ATS).

ВАКАНСИЯ: ${title}

ОПИСАНИЕ ВАКАНСИИ:
${description}

ТЕБЕ НУЖНО:
1. Выделить только квалификационные требования.
2. Игнорировать информацию о бонусах, культуре компании, адресе офиса и льготах (ДМС, печеньки), если это не касается требований к кандидату (например, "готовность работать в офисе").
3. Строго разделить требования на "Обязательные" (Must-have/Stop-factors) и "Желательные" (Nice-to-have).
4. Нормализовать названия технологий и навыков (например, "React.js" -> "React").

ФОРМАТ ВЫВОДА (JSON):
Верни ответ СТРОГО в формате валидного JSON без Markdown-разметки и без пояснительного текста.

{
  "job_title": "Название позиции",
  "summary": "Краткое описание сути роли в 1 предложении",
  "mandatory_requirements": ["Список критических требований (опыт лет, конкретные харды, языки, гражданство). Если этого нет — отказ."],
  "nice_to_have_skills": ["Навыки, которые дают преимущество, но не обязательны"],
  "tech_stack": ["Список всех технологий, инструментов, фреймворков, упомянутых в тексте"],
  "experience_years": {
    "min": число или null,
    "description": "Текстовое описание требований к опыту (например, '3+ года в финтехе')"
  },
  "languages": [
    {"language": "Название языка", "level": "Уровень (A1-C2 или Native)"}
  ],
  "location_type": "Remote / Office / Hybrid / Relocation",
  "keywords_for_matching": ["5-7 ключевых слов для векторного поиска"]
}`;
}

export async function getVacancyRequirements(
  vacancyId: string
): Promise<VacancyRequirements | null> {
  const vacancyData = await db.query.vacancy.findFirst({
    where: eq(vacancy.id, vacancyId),
  });

  return (vacancyData?.requirements as VacancyRequirements) ?? null;
}

/**
 * Парсит ответ AI в структурированные требования
 */
function parseRequirements(response: string): VacancyRequirements {
  try {
    const extracted = extractJsonFromText(response);

    if (!extracted) {
      throw new Error("JSON не найден в ответе AI");
    }

    const validated = vacancyRequirementsSchema.parse(extracted);
    return validated as VacancyRequirements;
  } catch (error) {
    console.error(`❌ Ошибка парсинга требований:`, error);
    throw error;
  }
}
