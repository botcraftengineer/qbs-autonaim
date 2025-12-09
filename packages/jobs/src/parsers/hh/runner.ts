import { getIntegrationCredentials } from "@qbs-autonaim/db";
import puppeteer from "puppeteer";
import { checkAndPerformLogin, loadCookies } from "./auth";
import { HH_CONFIG } from "./config";
import { parseResponses } from "./response-parser";
import { parseVacancies } from "./vacancy-parser";

interface RunHHParserOptions {
  workspaceId: string;
  skipResponses?: boolean;
}

export async function runHHParser(options: RunHHParserOptions): Promise<void> {
  const { workspaceId, skipResponses = false } = options;

  console.log("🚀 Запуск HH парсера");
  console.log(`   Workspace: ${workspaceId}`);
  console.log(`   Пропустить отклики: ${skipResponses}`);

  const credentials = await getIntegrationCredentials("hh", workspaceId);
  if (!credentials?.email || !credentials?.password) {
    throw new Error("Не найдены учетные данные для HH.ru");
  }

  const browser = await puppeteer.launch(HH_CONFIG.puppeteer);

  try {
    const page = await browser.newPage();

    await page.setUserAgent(HH_CONFIG.userAgent);
    await page.setViewport({ width: 1920, height: 1080 });

    // Load existing cookies if available
    const savedCookies = await loadCookies("hh", workspaceId);
    if (savedCookies && savedCookies.length > 0) {
      await page.setCookie(...savedCookies);
    }

    // Check authentication and perform login if needed
    await checkAndPerformLogin(
      page,
      credentials.email,
      credentials.password,
      workspaceId,
    );

    const vacancies = await parseVacancies(page, workspaceId);

    if (!skipResponses && vacancies.length > 0) {
      console.log("\n📨 Парсинг откликов...");

      for (const vacancy of vacancies) {
        if (vacancy.responsesUrl) {
          try {
            await parseResponses(page, vacancy.responsesUrl, workspaceId);
          } catch (error) {
            console.error(
              `❌ Ошибка парсинга откликов для ${vacancy.title}:`,
              error,
            );
          }
        }
      }
    }

    console.log("✅ Парсинг завершен успешно");
  } catch (error) {
    console.error("❌ Ошибка при парсинге:", error);
    throw error;
  } finally {
    // Properly close browser to avoid resource locks on Windows
    try {
      const pages = await browser.pages();
      await Promise.all(pages.map((page) => page.close()));
      await browser.close();
      // Give Windows time to release file handles
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (closeError) {
      console.warn("⚠️ Ошибка при закрытии браузера:", closeError);
      // Force kill browser process if normal close fails
      try {
        browser.process()?.kill("SIGKILL");
      } catch {
        // Ignore if already closed
      }
    }
  }
}
