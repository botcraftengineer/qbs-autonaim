/**
 * Утилиты для работы с именами кандидатов
 */

/**
 * Извлекает имя из полного ФИО
 *
 * В России обычно формат: "Фамилия Имя Отчество" или "Имя Фамилия"
 * Функция пытается определить, что является именем
 */
export function extractFirstName(fullName: string | null): string {
  const defaultName = "кандидат";

  if (!fullName) {
    return defaultName;
  }

  const nameParts = fullName.trim().split(/\s+/);

  if (nameParts.length === 0) {
    return defaultName;
  }

  if (nameParts.length === 1) {
    // Одно слово - используем как есть
    return nameParts[0] || defaultName;
  }

  // Несколько слов - проверяем, что первое слово похоже на фамилию
  const firstPart = nameParts[0];
  const secondPart = nameParts[1];

  if (!firstPart || !secondPart) {
    return firstPart || defaultName;
  }

  // Если первое слово заканчивается на типичные суффиксы фамилий, берем второе (имя)
  const surnamePattern =
    /(ов|ова|ев|ева|ин|ина|ын|ына|ский|ская|цкий|цкая|ской)$/i;

  if (firstPart.match(surnamePattern)) {
    return secondPart;
  }

  // Иначе считаем, что первое слово - это имя
  return firstPart;
}

/**
 * Паттерны для определения представления в сообщении
 */
const NAME_INTRODUCTION_PATTERNS = [
  // "Меня зовут Иван", "меня зовут Иван Петров"
  /меня\s+зовут\s+([А-ЯЁа-яё]+)/i,
  // "Я Иван", "Я - Иван"
  /^я\s*[-–—]?\s*([А-ЯЁа-яё]+)/i,
  // "Это Иван", "Это - Иван"
  /^это\s*[-–—]?\s*([А-ЯЁа-яё]+)/i,
  // "Привет, я Иван", "Здравствуйте, я Иван"
  /(?:привет|здравствуй(?:те)?|добрый\s+день)[,!.]?\s*я\s+([А-ЯЁа-яё]+)/i,
  // "Иван здесь", "Иван на связи"
  /^([А-ЯЁа-яё]+)\s+(?:здесь|на\s+связи|тут)/i,
];

/**
 * Пытается определить имя кандидата из истории сообщений
 *
 * @param conversationHistory - История сообщений
 * @returns Найденное имя или null
 */
export function extractNameFromHistory(
  conversationHistory: Array<{
    sender: string;
    content: string;
  }>,
): string | null {
  // Ищем только в сообщениях кандидата
  const candidateMessages = conversationHistory.filter(
    (msg) => msg.sender === "CANDIDATE",
  );

  for (const msg of candidateMessages) {
    const content = msg.content.trim();

    for (const pattern of NAME_INTRODUCTION_PATTERNS) {
      const match = content.match(pattern);
      if (match?.[1]) {
        // Валидируем, что найденное слово похоже на имя (первая буква заглавная или всё в нижнем регистре)
        const potentialName = match[1];
        if (potentialName.length >= 2 && potentialName.length <= 20) {
          // Форматируем имя с заглавной буквы
          return (
            potentialName.charAt(0).toUpperCase() +
            potentialName.slice(1).toLowerCase()
          );
        }
      }
    }
  }

  return null;
}

/**
 * Формирует персонализированное обращение к кандидату
 *
 * @param options - Параметры для формирования обращения
 * @returns Обращение или пустая строка
 */
export function getPersonalizedGreeting(options: {
  /** История сообщений для поиска представления */
  conversationHistory?: Array<{ sender: string; content: string }>;
  /** Имя из базы данных (используется только если разрешено) */
  candidateNameFromDB?: string | null;
  /** Разрешено ли использовать имя из базы данных */
  allowDBName?: boolean;
}): string {
  const {
    conversationHistory = [],
    candidateNameFromDB,
    allowDBName = false,
  } = options;

  // Приоритет 1: Имя из истории переписки
  const nameFromHistory = extractNameFromHistory(conversationHistory);
  if (nameFromHistory) {
    return nameFromHistory;
  }

  // Приоритет 2: Имя из базы данных (если разрешено)
  if (allowDBName && candidateNameFromDB) {
    return extractFirstName(candidateNameFromDB);
  }

  return "";
}

/**
 * Проверяет, уже ли поздоровался бот в истории
 *
 * @param conversationHistory - История сообщений
 * @returns true, если уже здоровался
 */
export function hasGreetedBefore(
  conversationHistory: Array<{ sender: string; content: string }>,
): boolean {
  const greetingPatterns = [
    /добрый\s+день/i,
    /здравствуй(?:те)?/i,
    /приветствую/i,
    /доброго\s+(?:времени|дня)/i,
  ];

  const botMessages = conversationHistory.filter((msg) => msg.sender === "BOT");

  for (const msg of botMessages) {
    for (const pattern of greetingPatterns) {
      if (pattern.test(msg.content)) {
        return true;
      }
    }
  }

  return false;
}
