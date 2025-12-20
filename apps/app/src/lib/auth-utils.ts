/**
 * Проверяет, является ли путь валидным внутренним путем приложения
 * @param path - Путь для проверки
 * @returns true если путь валиден, false в противном случае
 */
export const isValidInternalPath = (path: string): boolean => {
  // Проверяем, что путь начинается с '/' и не содержит протокол или '//'
  return (
    path.startsWith("/") &&
    !path.includes("//") &&
    !path.toLowerCase().includes("http:") &&
    !path.toLowerCase().includes("https:")
  );
};
