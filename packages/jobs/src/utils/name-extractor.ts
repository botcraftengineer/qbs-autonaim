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

// Примеры использования:
// extractFirstName("Иванов Иван Иванович") => "Иван"
// extractFirstName("Петрова Мария") => "Мария"
// extractFirstName("Александр Сидоров") => "Александр"
// extractFirstName("Дмитрий") => "Дмитрий"
// extractFirstName(null) => "кандидат"
