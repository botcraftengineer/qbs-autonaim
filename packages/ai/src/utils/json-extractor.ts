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

    // Стратегия 2: Итеративный парсер с отслеживанием глубины вложенности
    const firstBrace = text.indexOf("{");
    if (firstBrace === -1) {
      return null;
    }

    let startIndex = firstBrace;
    while (startIndex < text.length) {
      let depth = 0;
      let inString = false;
      let escapeNext = false;
      let endIndex = -1;

      for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (escapeNext) {
          escapeNext = false;
          continue;
        }

        if (char === "\\") {
          escapeNext = true;
          continue;
        }

        if (char === '"' && !inString) {
          inString = true;
          continue;
        }

        if (char === '"' && inString) {
          inString = false;
          continue;
        }

        if (inString) {
          continue;
        }

        if (char === "{") {
          depth++;
        } else if (char === "}") {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex !== -1) {
        const jsonStr = text.slice(startIndex, endIndex + 1);
        try {
          return JSON.parse(jsonStr);
        } catch {
          // Продолжаем поиск следующей пары скобок
          const nextBrace = text.indexOf("{", startIndex + 1);
          if (nextBrace === -1) {
            return null;
          }
          startIndex = nextBrace;
          continue;
        }
      }

      return null;
    }

    return null;
  } catch {
    return null;
  }
}
