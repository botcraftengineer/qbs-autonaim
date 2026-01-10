/**
 * Тесты для парсера профилей kwork.ru
 */

import { describe, expect, test } from "bun:test";
import { scrapeKworkProfile } from "./profile-scraper";

describe("scrapeKworkProfile", () => {
  test("должен парсить реальный профиль kwork.ru", async () => {
    const profileUrl = "https://kwork.ru/user/gravwlkr";

    const result = await scrapeKworkProfile(profileUrl);

    console.log("Результат парсинга:", JSON.stringify(result, null, 2));

    // Проверяем, что нет ошибок
    expect(result.error).toBeUndefined();

    // Проверяем, что есть навыки
    expect(result.skills).toBeDefined();
    expect(Array.isArray(result.skills)).toBe(true);

    // Если профиль публичный, должны быть данные
    if (result.skills.length > 0) {
      console.log("✅ Найдено навыков:", result.skills.length);
      console.log("Навыки:", result.skills);
    }

    if (result.aboutMe) {
      console.log("✅ О себе:", `${result.aboutMe.substring(0, 100)}...`);
    }

    if (result.statistics) {
      console.log("✅ Статистика:", result.statistics);
    }
  }, 10000); // 10 секунд таймаут для сетевого запроса
});
