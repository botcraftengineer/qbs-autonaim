/**
 * Извлекает JSON из текста с различными стратегиями парсинга
 */
export function extractJsonFromText(
  text: string
): Record<string, unknown> | null {
  if (!text) return null;

  try {
    // Попытка 1: Проверяем, является ли весь текст валидным JSON
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      return parsed;
    } catch (_e) {
      // Если нет, продолжаем другие попытки
    }

    // Попытка 2: Ищем JSON в Markdown блоке кода
    const codeBlockRegex = /```(?:json|javascript)\s*\n([\s\S]*?)\n```/;
    const codeBlockMatch = codeBlockRegex.exec(text);
    if (codeBlockMatch?.[1]) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]) as Record<string, unknown>;
        return parsed;
      } catch (_e) {
        // Если парсинг не удался, продолжаем
      }
    }

    // Попытка 3: Ищем любой блок кода
    const anyCodeBlockRegex = /```\s*\n([\s\S]*?)\n```/;
    const anyCodeBlockMatch = anyCodeBlockRegex.exec(text);
    if (anyCodeBlockMatch?.[1]) {
      try {
        const parsed = JSON.parse(anyCodeBlockMatch[1]) as Record<
          string,
          unknown
        >;
        return parsed;
      } catch (_e) {
        // Если парсинг не удался, продолжаем
      }
    }

    // Попытка 4: Ищем что-то похожее на JSON (начинается с { и заканчивается })
    const jsonLikeRegex = /{[\s\S]*?}/;
    const jsonLikeMatch = jsonLikeRegex.exec(text);
    if (jsonLikeMatch?.[0]) {
      try {
        const parsed = JSON.parse(jsonLikeMatch[0]) as Record<string, unknown>;
        return parsed;
      } catch (_e) {
        // Если парсинг не удался, продолжаем
      }
    }

    // Попытка 5: Пытаемся исправить неполный JSON
    const incompleteJsonRegex = /{[\s\S]*?(?:}|$)/;
    const incompleteJsonMatch = incompleteJsonRegex.exec(text);
    if (incompleteJsonMatch?.[0]) {
      try {
        let jsonText = incompleteJsonMatch[0];

        // Исправление 1: Балансируем фигурные скобки
        const openBraces = (jsonText.match(/{/g) || []).length;
        const closeBraces = (jsonText.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          jsonText += "}".repeat(openBraces - closeBraces);
        }

        // Исправление 2: Балансируем квадратные скобки
        const openBrackets = (jsonText.match(/\[/g) || []).length;
        const closeBrackets = (jsonText.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
          jsonText += "]".repeat(openBrackets - closeBrackets);
        }

        // Исправление 3: Убираем trailing запятые перед закрывающими скобками
        jsonText = jsonText.replace(/,\s*}/g, "}");
        jsonText = jsonText.replace(/,\s*]/g, "]");

        // Исправление 4: Добавляем кавычки вокруг имен свойств
        jsonText = jsonText.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');

        // Исправление 5: Заменяем одинарные кавычки на двойные
        jsonText = jsonText.replace(/'([^']*?)'/g, '"$1"');

        // Пытаемся распарсить исправленный JSON
        try {
          const parsed = JSON.parse(jsonText) as Record<string, unknown>;
          return parsed;
        } catch (parseError) {
          // Если все еще не можем распарсить, пробуем более агрессивные исправления
          const validJsonRegex = /{[^{]*?}/g;
          const validJsonMatches = [...jsonText.matchAll(validJsonRegex)];
          for (const match of validJsonMatches) {
            try {
              const parsed = JSON.parse(match[0]) as Record<string, unknown>;
              return parsed;
            } catch (_) {
              // Продолжаем к следующему совпадению
            }
          }
          throw parseError;
        }
      } catch (_e) {
        // Если все попытки исправить не удались, продолжаем
      }
    }

    // Ничего не найдено или не удалось распарсить
    return null;
  } catch (error) {
    console.error("Ошибка извлечения JSON из текста:", error);
    return null;
  }
}
