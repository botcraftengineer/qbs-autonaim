import { getIntegrationCredentials } from "@qbs-autonaim/db";
import { Log } from "crawlee";
import puppeteer from "puppeteer";
import { performLogin } from "./auth";
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

    console.log("🔐 Авторизация на HH.ru...");

    const log = new Log();

    await performLogin(
      page,
      log,
      credentials.email,
      credentials.password,
      workspaceId,
      true,
    );

    console.log("✅ Авторизация успешна");

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
  } finally {
    await browser.close();
  }
}
