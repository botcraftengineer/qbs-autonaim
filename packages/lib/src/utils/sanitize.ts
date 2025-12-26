/**
 * Удаляет нулевые байты из строки
 * PostgreSQL не поддерживает нулевые байты в UTF-8 строках
 */
export function removeNullBytes(str: string): string {
  return str.replace(/\0/g, "");
}

/**
 * Очищает объект от нулевых байтов во всех строковых полях
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };

  for (const key in result) {
    const value = result[key];
    if (typeof value === "string") {
      result[key] = removeNullBytes(value) as T[Extract<keyof T, string>];
    }
  }

  return result;
}
