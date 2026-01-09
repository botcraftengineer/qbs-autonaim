/**
 * Парсер профилей kwork.ru
 * Извлекает информацию "О себе" и навыки с публичной страницы профиля
 */

export interface KworkProfileData {
  aboutMe?: string;
  skills: string[];
  error?: string;
}

/**
 * Парсит профиль kwork.ru через fetch (без браузера)
 * Извлекает "О себе" и навыки из HTML
 */
export async function scrapeKworkProfile(
  profileUrl: string,
): Promise<KworkProfileData> {
  try {
    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    });

    if (!response.ok) {
      return {
        skills: [],
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Парсим "О себе"
    const aboutMe = extractAboutMe(html);

    // Парсим навыки
    const skills = extractSkills(html);

    return {
      aboutMe,
      skills,
    };
  } catch (error) {
    console.error("Ошибка парсинга профиля kwork.ru:", error);
    return {
      skills: [],
      error: error instanceof Error ? error.message : "Неизвестная ошибка",
    };
  }
}

/**
 * Извлекает текст "О себе" из HTML
 */
function extractAboutMe(html: string): string | undefined {
  // Ищем <div class="user-about-me">...</div>
  const aboutMeMatch = html.match(
    /<div\s+class="user-about-me"[^>]*>([\s\S]*?)<\/div>/i,
  );

  if (!aboutMeMatch?.[1]) {
    return undefined;
  }

  // Очищаем HTML теги и декодируем HTML entities
  let text = aboutMeMatch[1]
    .replace(/<[^>]+>/g, "") // Удаляем HTML теги
    .replace(/&nbsp;/g, " ") // Заменяем &nbsp; на пробел
    .replace(/&quot;/g, '"') // Заменяем &quot; на кавычки
    .replace(/&amp;/g, "&") // Заменяем &amp; на &
    .replace(/&lt;/g, "<") // Заменяем &lt; на <
    .replace(/&gt;/g, ">") // Заменяем &gt; на >
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code))) // Декодируем числовые entities
    .trim();

  // Удаляем лишние пробелы и переносы строк
  text = text.replace(/\s+/g, " ").trim();

  return text || undefined;
}

/**
 * Извлекает навыки из HTML
 */
function extractSkills(html: string): string[] {
  const skills: string[] = [];

  // Ищем <div class="user-skills__items">...</div>
  const skillsContainerMatch = html.match(
    /<div\s+class="user-skills__items"[^>]*>([\s\S]*?)<\/div>/i,
  );

  if (!skillsContainerMatch?.[1]) {
    return skills;
  }

  const skillsHtml = skillsContainerMatch[1];

  // Ищем все <div class="user-skills__item">...</div>
  const skillMatches = skillsHtml.matchAll(
    /<div\s+class="user-skills__item"[^>]*>([\s\S]*?)<\/div>/gi,
  );

  for (const match of skillMatches) {
    if (match[1]) {
      // Очищаем HTML теги и декодируем entities
      const skill = match[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
        .trim();

      if (skill) {
        skills.push(skill);
      }
    }
  }

  return skills;
}
