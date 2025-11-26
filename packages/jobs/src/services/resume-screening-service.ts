import type { ResumeScreeningData, ScreeningResult } from "../types/screening";
import { buildFullScreeningPrompt } from "../utils/resume-formatter";
import { getScreeningPrompt } from "./screening-prompt-service";

/**
 * Подготавливает промпт для скрининга резюме
 *
 * @param vacancyId - ID вакансии
 * @param resumeData - Данные резюме кандидата
 * @returns Готовый промпт для отправки в AI
 */
export async function prepareScreeningPrompt(
  vacancyId: string,
  resumeData: ResumeScreeningData
): Promise<string | null> {
  // Получаем промпт вакансии
  const vacancyPrompt = await getScreeningPrompt(vacancyId);

  if (!vacancyPrompt) {
    console.warn(`⚠️ Промпт для вакансии ${vacancyId} не найден`);
    return null;
  }

  // Формируем полный промпт
  return buildFullScreeningPrompt(vacancyPrompt, resumeData);
}

/**
 * Парсит ответ AI в структурированный результат
 *
 * @param aiResponse - Ответ от AI (JSON строка или объект)
 * @returns Структурированный результат скрининга
 */
export function parseScreeningResult(
  aiResponse: string | ScreeningResult
): ScreeningResult {
  if (typeof aiResponse === "string") {
    try {
      return JSON.parse(aiResponse) as ScreeningResult;
    } catch (error) {
      throw new Error(`Не удалось распарсить ответ AI: ${error}`);
    }
  }

  return aiResponse;
}

/**
 * Валидирует результат скрининга
 *
 * @param result - Результат скрининга
 * @returns true если результат валиден
 */
export function validateScreeningResult(result: ScreeningResult): boolean {
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
 * Полный процесс скрининга резюме (без вызова AI)
 * Возвращает промпт, который нужно отправить в AI
 *
 * @example
 * ```typescript
 * const prompt = await screenResume("vacancy-123", resumeData);
 * if (prompt) {
 *   const aiResponse = await openai.chat.completions.create({
 *     model: "gpt-4",
 *     messages: [{ role: "user", content: prompt }]
 *   });
 *   const result = parseScreeningResult(aiResponse.choices[0].message.content);
 *   if (validateScreeningResult(result)) {
 *     console.log("Результат:", result);
 *   }
 * }
 * ```
 */
export async function screenResume(
  vacancyId: string,
  resumeData: ResumeScreeningData
): Promise<string | null> {
  console.log(`🔍 Подготовка скрининга резюме для вакансии ${vacancyId}`);

  const prompt = await prepareScreeningPrompt(vacancyId, resumeData);

  if (!prompt) {
    console.error(`❌ Не удалось подготовить промпт для вакансии ${vacancyId}`);
    return null;
  }

  console.log(`✅ Промпт подготовлен (${prompt.length} символов)`);
  return prompt;
}
