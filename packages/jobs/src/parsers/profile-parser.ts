/**
 * Парсер профилей фриланс-платформ
 * Извлекает данные профиля по URL для использования в оценке откликов
 */

export interface ProfileData {
  platform: "kwork" | "fl" | "weblancer" | "upwork" | "freelancer" | "unknown";
  username: string;
  profileUrl: string;
  rawData?: string;
  parsedAt: Date;
  error?: string;
}

/**
 * Определяет платформу по URL профиля
 */
function detectPlatform(url: string): ProfileData["platform"] {
  const urlLower = url.toLowerCase();

  if (urlLower.includes("kwork.ru")) return "kwork";
  if (urlLower.includes("fl.ru")) return "fl";
  if (urlLower.includes("weblancer.net")) return "weblancer";
  if (urlLower.includes("upwork.com")) return "upwork";
  if (urlLower.includes("freelancer.com")) return "freelancer";

  return "unknown";
}

/**
 * Извлекает username из URL профиля
 */
function extractUsername(
  url: string,
  platform: ProfileData["platform"],
): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    switch (platform) {
      case "kwork":
        // https://kwork.ru/user/username
        return pathname.split("/user/")[1]?.split("/")[0] || "";
      case "fl":
        // https://fl.ru/users/username/
        return pathname.split("/users/")[1]?.split("/")[0] || "";
      case "weblancer":
        // https://weblancer.net/users/username/
        return pathname.split("/users/")[1]?.split("/")[0] || "";
      case "upwork":
        // https://upwork.com/freelancers/username
        return pathname.split("/freelancers/")[1]?.split("/")[0] || "";
      case "freelancer":
        // https://freelancer.com/u/username
        return pathname.split("/u/")[1]?.split("/")[0] || "";
      default:
        return "";
    }
  } catch {
    return "";
  }
}

/**
 * Парсит профиль фрилансера по URL
 * В текущей реализации только извлекает метаданные из URL
 * В будущем можно добавить реальный парсинг через API или скрапинг
 */
export async function parseFreelancerProfile(
  profileUrl: string,
): Promise<ProfileData> {
  const platform = detectPlatform(profileUrl);
  const username = extractUsername(profileUrl, platform);

  if (!username) {
    return {
      platform,
      username: "",
      profileUrl,
      parsedAt: new Date(),
      error: "Не удалось извлечь username из URL",
    };
  }

  // TODO: В будущем здесь можно добавить реальный парсинг профиля
  // Например, через Playwright или API платформы (если доступно)
  // const profileData = await scrapeProfile(profileUrl, platform);

  return {
    platform,
    username,
    profileUrl,
    parsedAt: new Date(),
  };
}

/**
 * Форматирует данные профиля для сохранения в БД
 */
export function formatProfileDataForStorage(
  profile:
    | ProfileData
    | {
        platform: string;
        username: string;
        profileUrl: string;
        parsedAt: string | Date;
        error?: string;
      },
): string {
  const parsedAt =
    profile.parsedAt instanceof Date
      ? profile.parsedAt.toISOString()
      : profile.parsedAt;

  return JSON.stringify({
    platform: profile.platform,
    username: profile.username,
    profileUrl: profile.profileUrl,
    parsedAt,
    error: profile.error,
  });
}
