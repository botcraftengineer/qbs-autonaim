import { eq } from "@selectio/db";
import { db } from "@selectio/db/client";
import { responseScreening, vacancyResponse } from "@selectio/db/schema";
import { generateText } from "../lib/ai-client";
import { responseScreeningResultSchema } from "../schemas/response-screening.schema";
import type { VacancyRequirements } from "../types/screening";
import { extractJsonFromText } from "../utils/json-extractor";
import { getVacancyRequirements } from "./screening-prompt-service";
/**
 * Скринит отклик и генерирует вопросы для кандидата
 */
export async function screenResponse(responseId: string) {
  console.log(`🎯 Скрининг отклика ${responseId}`);
  const response = await db.query.vacancyResponse.findFirst({
    where: eq(vacancyResponse.id, responseId),
  });

  if (!response) {
    throw new Error(`Отклик ${responseId} не найден`);
  }

  const requirements = await getVacancyRequirements(response.vacancyId);

  if (!requirements) {
    throw new Error(`Требования для вакансии ${response.vacancyId} не найдены`);
  }

  const prompt = buildScreeningPrompt(response, requirements);

  console.log(`📤 Отправка запроса в AI для скрининга`);

  const { text } = await generateText({
    prompt,
    temperature: 0.3,
    generationName: "screen-response",
    entityId: responseId,
    metadata: {
      responseId,
      vacancyId: response.vacancyId,
    },
  });
  console.log(`📥 Получен ответ от AI`);

  const result = parseScreeningResult(text);

  await db.insert(responseScreening).values({
    responseId,
    score: result.score,
    detailedScore: result.detailedScore,
    analysis: result.analysis,
  });

  await db
    .update(vacancyResponse)
    .set({ status: "EVALUATED" })
    .where(eq(vacancyResponse.id, responseId));

  console.log(
    `✅ Результат скрининга сохранен: оценка ${result.score}/5 (${result.detailedScore}/100)`,
  );

  return result;
}

function buildScreeningPrompt(
  response: typeof vacancyResponse.$inferSelect,
  requirements: VacancyRequirements,
): string {
  return `Ты — эксперт по подбору персонала. Оцени соответствие резюме кандидата требованиям вакансии.

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
Имя: ${response.candidateName || "Не указано"}

Опыт работы:
${response.experience || "Не указан"}

Образование:
${response.education || "Не указано"}

О себе:
${response.about || "Не указано"}

Языки:
${response.languages || "Не указаны"}

Курсы:
${response.courses || "Не указаны"}

ЗАДАЧА:
1. Оцени соответствие резюме требованиям по двум шкалам:
   
   a) Общая оценка (score) от 1 до 5:
   - 1: Совершенно не подходит
   - 2: Слабое соответствие
   - 3: Среднее соответствие
   - 4: Хорошее соответствие
   - 5: Отличное соответствие
   
   b) Детальная оценка (detailedScore) от 0 до 100:
   - Более точная оценка для определения победителя среди кандидатов
   - Учитывай все нюансы: опыт, навыки, образование, языки, мотивацию
   - Эта оценка поможет ранжировать кандидатов с одинаковым score

2. Напиши краткий анализ (2-3 предложения): что подходит, чего не хватает.

ФОРМАТ ОТВЕТА (JSON):
Верни ответ СТРОГО в формате валидного JSON без Markdown-разметки.

{
  "score": число от 1 до 5,
  "detailedScore": число от 0 до 100,
  "analysis": "Краткий анализ соответствия"
}`;
}

function parseScreeningResult(text: string) {
  try {
    const extracted = extractJsonFromText(text);

    if (!extracted) {
      throw new Error("JSON не найден в ответе AI");
    }

    const validated = responseScreeningResultSchema.parse(extracted);
    return validated;
  } catch (error) {
    console.error(`❌ Ошибка парсинга результата скрининга:`, error);
    throw error;
  }
}
