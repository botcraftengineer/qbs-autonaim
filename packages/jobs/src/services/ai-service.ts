import { deepseek } from "@ai-sdk/deepseek";
import { generateText } from "ai";
import type { ResumeScreeningData, ScreeningResult } from "../types/screening";
import { buildFullScreeningPrompt } from "../utils/resume-formatter";
import { getScreeningPrompt } from "./screening-prompt-service";

/**
 * Выполняет скрининг резюме через DeepSeek AI
 *
 * @param vacancyId - ID вакансии
 * @param resumeData - Данные резюме кандидата
 * @returns Результат скрининга
 */
export async function screenResumeWithAI(
  vacancyId: string,
  resumeData: ResumeScreeningData
): Promise<ScreeningResult | null> {
  console.log(`🤖 Запуск AI скрининга для вакансии ${vacancyId}`);

  try {
    // Получаем промпт вакансии
    const vacancyPrompt = await getScreeningPrompt(vacancyId);

    if (!vacancyPrompt) {
      console.error(`❌ Промпт для вакансии ${vacancyId} не найден`);
      return null;
    }

    // Формируем полный промпт
    const fullPrompt = buildFullScreeningPrompt(vacancyPrompt, resumeData);

    console.log(
      `📤 Отправка запроса в DeepSeek (${fullPrompt.length} символов)`
    );

    // Вызываем DeepSeek
    const { text } = await generateText({
      model: deepseek("deepseek-chat"),
      prompt: fullPrompt,
      temperature: 0.3,
    });

    console.log(`📥 Получен ответ от DeepSeek`);

    // Парсим JSON ответ
    const result = parseAIResponse(text);

    if (!result) {
      console.error(`❌ Не удалось распарсить ответ AI`);
      return null;
    }

    console.log(
      `✅ Скрининг завершен: ${result.match_percentage}% соответствие, рекомендация: ${result.recommendation}`
    );

    return result;
  } catch (error) {
    console.error(`❌ Ошибка при скрининге через AI:`, error);
    return null;
  }
}

/**
 * Парсит ответ от AI в структурированный результат
 */
function parseAIResponse(response: string): ScreeningResult | null {
  try {
    // Пытаемся найти JSON в ответе
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ JSON не найден в ответе AI");
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as ScreeningResult;

    // Валидация
    if (!validateScreeningResult(result)) {
      console.error("❌ Результат не прошел валидацию");
      return null;
    }

    return result;
  } catch (error) {
    console.error(`❌ Ошибка парсинга ответа AI:`, error);
    return null;
  }
}

/**
 * Валидирует результат скрининга
 */
function validateScreeningResult(result: ScreeningResult): boolean {
  return (
    typeof result.match_percentage === "number" &&
    result.match_percentage >= 0 &&
    result.match_percentage <= 100 &&
    ["invite", "reject", "need_info"].includes(result.recommendation) &&
    Array.isArray(result.strengths) &&
    Array.isArray(result.weaknesses) &&
    typeof result.summary === "string"
  );
}

/**
 * Пакетный скрининг нескольких резюме
 *
 * @param vacancyId - ID вакансии
 * @param resumes - Массив данных резюме
 * @returns Массив результатов скрининга
 */
export async function batchScreenResumes(
  vacancyId: string,
  resumes: ResumeScreeningData[]
): Promise<(ScreeningResult | null)[]> {
  console.log(
    `🔄 Пакетный скрининг ${resumes.length} резюме для вакансии ${vacancyId}`
  );

  const results = await Promise.all(
    resumes.map((resume) => screenResumeWithAI(vacancyId, resume))
  );

  const successCount = results.filter((r) => r !== null).length;
  console.log(
    `✅ Успешно обработано ${successCount} из ${resumes.length} резюме`
  );

  return results;
}
