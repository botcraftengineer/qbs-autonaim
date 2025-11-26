import { PuppeteerCrawler } from "crawlee";
import type { CookieParam } from "puppeteer";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { env } from "../../env";
import {
  getResponsesWithoutDetails,
  updateResponseDetails,
} from "../../services/response-service";
import { loadCookies, performLogin, saveCookies } from "./auth";
import { HH_CONFIG } from "./config";
import { parseResumeExperience } from "./resume-parser";

puppeteer.use(StealthPlugin());

export async function runEnricher() {
  const email = env.HH_EMAIL;
  const password = env.HH_PASSWORD;

  console.log("🚀 Запуск обогащения данных резюме...");

  // Получаем список откликов без деталей
  const responsesToEnrich = await getResponsesWithoutDetails();
  console.log(
    `📋 Найдено ${responsesToEnrich.length} откликов без детальной информации`
  );

  if (responsesToEnrich.length === 0) {
    console.log("✅ Все отклики уже имеют детальную информацию");
    return;
  }

  const savedCookies = await loadCookies();

  // Формируем список запросов для краулера
  // Добавляем стартовый URL для логина/проверки сессии
  const startUrl = HH_CONFIG.urls.login;

  // Flag to track if cookies have been restored
  let cookiesRestored = false;

  const crawler = new PuppeteerCrawler({
    headless: HH_CONFIG.puppeteer.headless,
    launchContext: {
      launcher: puppeteer,
      launchOptions: {
        headless: HH_CONFIG.puppeteer.headless,
        args: HH_CONFIG.puppeteer.args,
        ignoreDefaultArgs: HH_CONFIG.puppeteer.ignoreDefaultArgs,
        slowMo: HH_CONFIG.puppeteer.slowMo,
      },
    },
    preNavigationHooks: [
      async ({ page, log }) => {
        // Скрываем признаки автоматизации
        await page.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => false,
          });
          Object.defineProperty(navigator, "plugins", {
            get: () => [1, 2, 3, 4, 5],
          });
          Object.defineProperty(navigator, "languages", {
            get: () => ["ru-RU", "ru", "en-US", "en"],
          });
          (window as any).chrome = {
            runtime: {},
          };
          const originalQuery = window.navigator.permissions.query;
          window.navigator.permissions.query = (
            parameters: PermissionDescriptor
          ) =>
            parameters.name === "notifications"
              ? Promise.resolve({
                  state: Notification.permission,
                } as PermissionStatus)
              : originalQuery(parameters);
        });

        // Restore cookies only once at the very beginning
        if (savedCookies && !cookiesRestored) {
          log.info("🍪 Восстанавливаем сохраненные куки...");
          await page.browserContext().setCookie(...(savedCookies as any[]));
          cookiesRestored = true;
        }

        await page.setUserAgent({
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });

        await page.setViewport({
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
        });
      },
    ],
    async requestHandler({ page, request, log, crawler }) {
      // Если это стартовый URL, проверяем логин
      if (request.url === startUrl) {
        log.info("🔐 Проверка авторизации...");
        await page.waitForNetworkIdle({
          timeout: HH_CONFIG.timeouts.networkIdle,
        });

        const loginInput = await page.$('input[type="text"][name="username"]');
        if (loginInput) {
          await performLogin(page, log, email, password);
        } else {
          log.info("✅ Успешно авторизованы");
        }

        // Сохраняем куки после успешной проверки/логина
        const cookies = await page.browserContext().cookies();
        await saveCookies(cookies);

        // Добавляем задачи на парсинг резюме после успешного логина
        const requests = responsesToEnrich.map((r) => ({
          url: r.resumeUrl,
          uniqueKey: r.resumeId,
          userData: {
            resumeId: r.resumeId,
            vacancyId: r.vacancyId,
            candidateName: r.candidateName,
          },
        }));

        log.info(`🚀 Добавляем ${requests.length} задач в очередь...`);
        await crawler.addRequests(requests);
        return;
      }

      // Добавляем случайную задержку между 3-5 секунд для имитации человеческого поведения
      const delay = Math.floor(Math.random() * 2000) + 3000;
      log.info(`⏳ Ожидание ${delay}ms перед обработкой...`);
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Обработка резюме
      const { resumeId, vacancyId, candidateName } = request.userData;
      log.info(`📊 Парсинг резюме: ${candidateName} (${request.url})`);

      try {
        const experienceData = await parseResumeExperience(page, request.url);

        await updateResponseDetails({
          vacancyId,
          resumeId,
          resumeUrl: request.url,
          candidateName,
          experience: experienceData.experience,
          contacts: experienceData.contacts,
          languages: experienceData.languages,
          about: experienceData.about,
          education: experienceData.education,
          courses: experienceData.courses,
        });

        log.info(`✅ Данные обновлены для: ${candidateName}`);
      } catch (error) {
        log.error(`❌ Ошибка парсинга для ${candidateName}: ${error}`);
        // Можно добавить логику повторных попыток или пометки ошибки в БД
      }
    },
    // Ограничиваем количество одновременных вкладок, чтобы не спамить
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: HH_CONFIG.timeouts.requestHandler,
  });

  // Запускаем с начальным URL
  await crawler.run([startUrl]);
}
