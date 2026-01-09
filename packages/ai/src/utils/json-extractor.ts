/**
 * Утилита для извлечения JSON из текстовых ответов AI
 */

/**
 * Извлекает JSON объект из текста, пробуя несколько стратегий:
 * 1. Поиск JSON в fenced code block (```json ... ```)
 * 2. Поиск первого { и последнего } в тексте
 *
 * @param text - Текст, содержащий JSON
 * @returns Распарсенный объект или null при неудаче
 */
export function extractJsonObject(text: string): unknown | null {
  try {
    // Стратегия 1: Ищем JSON в fenced code block
    const fencedMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1]);
      } catch {
        // Продолжаем к следующей стратегии
      }
    }

    // Стратегия 2: Ищем первый { и последний }
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonStr = text.slice(firstBrace, lastBrace + 1);
      return JSON.parse(jsonStr);
    }

    return null;
  } catch {
    return null;
  }
}
