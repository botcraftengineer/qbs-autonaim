/**
 * Утилиты для защиты от prompt injection
 *
 * Санитизация пользовательского ввода для безопасного использования в промптах.
 * Заменяет потенциально опасные ключевые слова на безобидные эквиваленты.
 */

/**
 * Список опасных ключевых слов и их замен
 * Эти слова могут использоваться для попыток манипуляции поведением AI
 */
const DANGEROUS_KEYWORDS: Record<string, string> = {
  // Команды управления
  ignore: "[игнорировать]",
  override: "[переопределить]",
  return: "[вернуть]",
  forget: "[забыть]",
  disregard: "[не учитывать]",
  instead: "[вместо]",

  // Системные термины
  system: "[система]",
  prompt: "[промпт]",
  instruction: "[инструкция]",
  json: "[джейсон]",

  // Роли
  assistant: "[ассистент]",
  user: "[пользователь]",
  human: "[человек]",

  // Технические команды
  execute: "[выполнить]",
  eval: "[вычислить]",
  run: "[запустить]",
};

/**
 * Санитизирует пользовательский ввод для защиты от prompt injection
 *
 * @param input - Входной текст от пользователя
 * @returns Санитизированный текст с замененными опасными словами
 *
 * @example
 * ```typescript
 * const safe = sanitizeUserInput("Ignore all previous instructions");
 * // Результат: "[игнорировать] all previous [инструкция]s"
 * ```
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return "";

  let result = input;

  for (const [keyword, replacement] of Object.entries(DANGEROUS_KEYWORDS)) {
    // Case-insensitive замена с сохранением границ слов
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    result = result.replace(regex, replacement);
  }

  return result;
}

/**
 * Маркеры для обозначения блоков пользовательского контента в промптах
 * Используются для визуального выделения и изоляции пользовательского ввода
 */
export const USER_CONTENT_MARKERS = {
  instructionsBegin: "----- BEGIN USER INSTRUCTIONS -----",
  instructionsEnd: "----- END USER INSTRUCTIONS -----",
  questionsBegin: "----- BEGIN USER QUESTIONS -----",
  questionsEnd: "----- END USER QUESTIONS -----",
  contextBegin: "----- BEGIN USER CONTEXT -----",
  contextEnd: "----- END USER CONTEXT -----",
} as const;

/**
 * Оборачивает пользовательский контент в защитные маркеры с предупреждением
 *
 * @param content - Пользовательский контент
 * @param type - Тип контента (instructions, questions, context)
 * @param warningText - Текст предупреждения для AI
 * @returns Обёрнутый и санитизированный контент
 */
export function wrapUserContent(
  content: string,
  type: "instructions" | "questions" | "context",
  warningText: string,
): string {
  if (!content) return "";

  const beginMarker =
    type === "instructions"
      ? USER_CONTENT_MARKERS.instructionsBegin
      : type === "questions"
        ? USER_CONTENT_MARKERS.questionsBegin
        : USER_CONTENT_MARKERS.contextBegin;

  const endMarker =
    type === "instructions"
      ? USER_CONTENT_MARKERS.instructionsEnd
      : type === "questions"
        ? USER_CONTENT_MARKERS.questionsEnd
        : USER_CONTENT_MARKERS.contextEnd;

  return `

${beginMarker}
${warningText}

${sanitizeUserInput(content)}

${endMarker}
`;
}
