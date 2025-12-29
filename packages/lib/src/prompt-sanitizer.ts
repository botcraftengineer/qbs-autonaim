/**
 * Санитизация и нормализация промптов для защиты от prompt injection
 */

/**
 * Удаляет или экранирует потенциально опасные последовательности
 */
export function sanitizePromptText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  let sanitized = text;

  // Удаляем управляющие символы (кроме переносов строк и табуляции)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, "");

  // Ограничиваем последовательности специальных символов
  // Заменяем 4+ повторяющихся спецсимвола на 3
  sanitized = sanitized.replace(
    /([!@#$%^&*()_+=\-[\]{}|\\:;"'<>,.?/`~])\1{3,}/g,
    "$1$1$1",
  );

  // Удаляем или экранируем потенциальные prompt injection паттерны
  const dangerousPatterns = [
    // Системные директивы
    /\b(system|assistant|user):\s*/gi,
    /\b(ignore|disregard|forget)\s+(previous|above|all|instructions?)\b/gi,
    /\b(new|updated?)\s+instructions?\b/gi,

    // Попытки изменить роль
    /\bact\s+as\b/gi,
    /\byou\s+are\s+now\b/gi,
    /\bpretend\s+to\s+be\b/gi,

    // Попытки получить системную информацию
    /\bshow\s+(me\s+)?(your|the)\s+(prompt|instructions?|system|rules?)\b/gi,
    /\bwhat\s+(is|are)\s+your\s+(prompt|instructions?|system|rules?)\b/gi,
  ];

  for (const pattern of dangerousPatterns) {
    sanitized = sanitized.replace(pattern, (match) => {
      // Заменяем на версию с пробелами между буквами
      return match.split("").join(" ");
    });
  }

  // Ограничиваем длинные блоки кода (более 500 символов)
  sanitized = sanitized.replace(/```[\s\S]{500,}?```/g, (match) => {
    return `${match.slice(0, 500)}... [код обрезан для безопасности]`;
  });

  // Удаляем множественные переносы строк (более 3 подряд)
  sanitized = sanitized.replace(/\n{4,}/g, "\n\n\n");

  // Удаляем лишние пробелы
  sanitized = sanitized.replace(/[ \t]{2,}/g, " ");

  return sanitized.trim();
}

/**
 * Обрезает текст до максимальной длины
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}...`;
}

/**
 * Санитизирует объект сообщения из истории диалога
 */
export function sanitizeConversationMessage(message: {
  role: string;
  content: string;
}): { role: "user" | "assistant"; content: string } {
  const role = message.role === "assistant" ? "assistant" : "user";
  const content = sanitizePromptText(message.content);

  return {
    role,
    content: truncateText(content, 2000), // Ограничиваем каждое сообщение
  };
}
