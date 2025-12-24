/**
 * Генерирует URL для аватара
 * Если photoUrl передан, возвращает его
 * Иначе генерирует аватар с инициалами через DiceBear API
 *
 * @param photoUrl - URL фото из базы данных (может быть null/undefined)
 * @param name - Имя для генерации инициалов
 * @returns URL аватара
 */
export function getAvatarUrl(
  photoUrl: string | null | undefined,
  name: string,
): string {
  if (photoUrl) {
    return photoUrl;
  }

  return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&scale=50`;
}

/**
 * Генерирует инициалы из имени
 *
 * @param name - Полное имя
 * @returns Инициалы (до 2 символов)
 */
export function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(" ")
      .filter((n) => n.length > 0)
      .slice(0, 2)
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase() || ""
  );
}
