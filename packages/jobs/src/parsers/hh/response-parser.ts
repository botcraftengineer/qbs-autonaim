import type { Page } from "puppeteer";
import {
  checkResponseExists,
  hasDetailedInfo,
  saveBasicResponse,
  updateResponseDetails,
} from "../../services/response-service";
import type { ResponseData } from "../types";
import { HH_CONFIG } from "./config";
import { humanDelay, humanScroll, randomDelay } from "./human-behavior";
import { parseResumeExperience } from "./resume-parser";
import { extractResumeId } from "./utils";

interface ResponseWithId extends ResponseData {
  resumeId: string;
}

export async function parseResponses(
  page: Page,
  url: string,
  vacancyId: string
): Promise<ResponseData[]> {
  // Извлекаем vacancyId из URL если он там есть
  const urlObj = new URL(url, HH_CONFIG.urls.baseUrl);
  const urlVacancyId = urlObj.searchParams.get("vacancyId") || vacancyId;

  console.log(`🚀 Начинаем парсинг откликов для вакансии ${urlVacancyId}`);

  // ЭТАП 1: Собираем все отклики со всех страниц
  console.log("\n📋 ЭТАП 1: Сбор всех откликов...");
  const allResponses = await collectAllResponses(page, urlVacancyId);

  if (allResponses.length === 0) {
    console.log("⚠️ Не найдено откликов для обработки");
    return [];
  }

  console.log(`✅ Собрано откликов: ${allResponses.length}`);

  // ЭТАП 2: Сохраняем базовую информацию всех новых откликов
  console.log("\n💾 ЭТАП 2: Сохранение базовой информации...");
  await saveBasicResponses(allResponses, vacancyId);

  // ЭТАП 3: Определяем отклики без детальной информации
  console.log("\n🔍 ЭТАП 3: Поиск откликов без детальной информации...");
  const responsesNeedingDetails =
    await filterResponsesNeedingDetails(allResponses);

  console.log(
    `✅ Откликов требующих парсинга деталей: ${responsesNeedingDetails.length}`
  );

  if (responsesNeedingDetails.length === 0) {
    console.log("ℹ️ Все отклики уже имеют детальную информацию");
    return allResponses;
  }

  // ЭТАП 4: Парсим детальную информацию резюме
  console.log("\n📊 ЭТАП 4: Парсинг детальной информации резюме...");
  await parseResponseDetails(page, responsesNeedingDetails, vacancyId);

  console.log(
    `\n🎉 Парсинг завершен! Обработано откликов: ${responsesNeedingDetails.length}`
  );

  return allResponses;
}

/**
 * ЭТАП 1: Собирает все отклики со всех страниц
 */
async function collectAllResponses(
  page: Page,
  vacancyId: string
): Promise<ResponseWithId[]> {
  const allResponses: ResponseWithId[] = [];
  let currentPage = 0;

  while (true) {
    const pageUrl =
      currentPage === 0
        ? `https://hh.ru/employer/vacancyresponses?vacancyId=${vacancyId}`
        : `https://hh.ru/employer/vacancyresponses?vacancyId=${vacancyId}&page=${currentPage}`;

    console.log(`📄 Страница ${currentPage}: ${pageUrl}`);

    try {
      await page.goto(pageUrl, { waitUntil: "networkidle2", timeout: 30000 });
    } catch (error) {
      console.error(`❌ Ошибка загрузки страницы ${currentPage}:`, error);
      break;
    }

    await humanDelay(1000, 2000);

    // Проверяем наличие контейнера с откликами
    const hasResponses = await page
      .waitForSelector('div[data-qa="vacancy-real-responses"]', {
        timeout: HH_CONFIG.timeouts.selector,
      })
      .then(() => true)
      .catch(() => false);

    if (!hasResponses) {
      console.log(
        `⚠️ Контейнер с откликами не найден на странице ${currentPage}`
      );
      break;
    }

    // Скроллим для подгрузки
    await humanScroll(page);
    await humanDelay(1000, 2000);

    // Парсим отклики на странице
    const pageResponses = await page.$$eval(
      'div[data-qa="vacancy-real-responses"] [data-resume-id]',
      (elements: Element[]) => {
        return elements.map((el) => {
          const link = el.querySelector('a[data-qa*="serp-item__title"]');
          const url = link ? link.getAttribute("href") : "";
          const nameEl = el.querySelector(
            'span[data-qa="resume-serp__resume-fullname"]'
          );
          const name = nameEl ? nameEl.textContent?.trim() : "";

          return {
            name,
            url: url ? new URL(url, "https://hh.ru").href : "",
          };
        });
      }
    );

    if (pageResponses.length === 0) {
      console.log(`⚠️ Нет откликов на странице ${currentPage}`);
      break;
    }

    // Извлекаем resumeId для каждого отклика
    for (const response of pageResponses) {
      if (response.url) {
        const resumeId = extractResumeId(response.url);
        if (resumeId) {
          allResponses.push({
            ...response,
            resumeId,
          });
        } else {
          console.log(`⚠️ Не удалось извлечь ID из URL: ${response.url}`);
        }
      }
    }

    console.log(
      `✅ Страница ${currentPage}: найдено ${pageResponses.length} откликов`
    );

    currentPage++;
    await humanDelay(1500, 3000);
  }

  return allResponses;
}

/**
 * ЭТАП 2: Сохраняет базовую информацию всех новых откликов
 */
async function saveBasicResponses(
  responses: ResponseWithId[],
  vacancyId: string
): Promise<void> {
  let savedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;

    const exists = await checkResponseExists(response.resumeId);

    if (!exists) {
      await saveBasicResponse(
        vacancyId,
        response.resumeId,
        response.url,
        response.name
      );
      savedCount++;
    } else {
      skippedCount++;
      console.log(
        `⏭️ Пропуск ${i + 1}/${responses.length}: ${response.name} (уже в базе)`
      );
    }
  }

  console.log(
    `✅ Сохранено новых: ${savedCount}, Пропущено (уже в базе): ${skippedCount}`
  );
}

/**
 * ЭТАП 3: Фильтрует отклики, которым нужна детальная информация
 */
async function filterResponsesNeedingDetails(
  responses: ResponseWithId[]
): Promise<ResponseWithId[]> {
  const responsesNeedingDetails: ResponseWithId[] = [];

  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;

    const hasDetails = await hasDetailedInfo(response.resumeId);

    if (!hasDetails) {
      responsesNeedingDetails.push(response);
      console.log(
        `📝 Требуется парсинг ${i + 1}/${responses.length}: ${response.name}`
      );
    } else {
      console.log(
        `✅ Детали есть ${i + 1}/${responses.length}: ${response.name}`
      );
    }
  }

  return responsesNeedingDetails;
}

/**
 * ЭТАП 4: Парсит детальную информацию резюме и обновляет записи
 */
async function parseResponseDetails(
  page: Page,
  responses: ResponseWithId[],
  vacancyId: string
): Promise<void> {
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i];
    if (!response) continue;

    try {
      console.log(
        `\n📊 Парсинг резюме ${i + 1}/${responses.length}: ${response.name}`
      );

      // Случайная задержка между просмотром резюме (имитация человека)
      if (i > 0) {
        const delay = randomDelay(3000, 8000);
        console.log(
          `⏳ Пауза ${Math.round(delay / 1000)}с перед следующим резюме...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Парсим детальную информацию резюме
      const experienceData = await parseResumeExperience(page, response.url);

      // Обновляем детальную информацию в базе
      await updateResponseDetails({
        vacancyId,
        resumeId: response.resumeId,
        resumeUrl: response.url,
        candidateName: response.name,
        experience: experienceData.experience,
        contacts: experienceData.contacts,
        languages: experienceData.languages,
        about: experienceData.about,
        education: experienceData.education,
        courses: experienceData.courses,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `❌ Ошибка парсинга резюме ${response.name}:`,
        errorMessage
      );

      // Пауза после ошибки
      await humanDelay(3000, 5000);
    }
  }
}
