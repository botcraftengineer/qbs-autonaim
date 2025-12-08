import { extractTelegramUsername } from "@selectio/prompts";
import axios from "axios";
import type { Page } from "puppeteer";
import type { ResumeExperience } from "../types";
import { HH_CONFIG } from "./config";

/**
 * Проверяет, является ли буфер PDF файлом по magic bytes
 */
function isPdfBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  );
}

/**
 * Проверяет, является ли буфер текстовым файлом
 */
function isTextBuffer(buffer: Buffer): boolean {
  if (buffer.length === 0) return false;
  // Проверяем что это текст (UTF-8)
  try {
    const text = buffer.toString("utf-8");
    return text.length > 0 && !text.includes("\ufffd");
  } catch {
    return false;
  }
}

/**
 * Скачивает файл резюме с HH.ru (PDF или TXT)
 */
async function downloadResumeFile(
  page: Page,
  resumeUrl: string,
  fileType: "pdf" | "txt",
): Promise<Buffer | null> {
  try {
    console.log(`📥 Скачивание ${fileType.toUpperCase()} резюме...`);

    const urlMatch = resumeUrl.match(/\/resume\/([a-f0-9]+)/);
    const vacancyIdMatch = resumeUrl.match(/vacancyId=(\d+)/);

    if (!urlMatch?.[1]) {
      console.log("⚠️ Не удалось извлечь hash резюме из URL");
      return null;
    }

    const resumeHash = urlMatch[1];
    const vacancyId = vacancyIdMatch?.[1] || "";

    const candidateName = await page
      .evaluate(() => {
        const nameEl = document.querySelector(
          'span[data-qa="resume-personal-name"]',
        );
        return nameEl?.textContent?.trim() || "resume";
      })
      .catch(() => "resume");

    const fileUrl = `https://hh.ru/resume_converter/${encodeURIComponent(candidateName)}.${fileType}?hash=${resumeHash}${vacancyId ? `&vacancyId=${vacancyId}` : ""}&type=${fileType}&hhtmSource=resume&hhtmFrom=employer_vacancy_responses`;

    console.log(`📄 URL: ${fileUrl}`);

    const cookies = await page.browserContext().cookies();
    const cookieString = cookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");

    const response = await axios.get(fileUrl, {
      headers: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        Cookie: cookieString,
        Host: "hh.ru",
        Pragma: "no-cache",
        Referer: page.url(),
        "Sec-Ch-Ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "same-origin",
        "Sec-Fetch-User": "?1",
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": HH_CONFIG.userAgent,
      },
      responseType: "arraybuffer",
      timeout: 30000,
      maxRedirects: 5,
    });

    const buffer = Buffer.from(response.data);

    if (fileType === "pdf" && !isPdfBuffer(buffer)) {
      console.log("⚠️ Скачанный файл не является PDF");
      return null;
    }

    if (fileType === "txt" && !isTextBuffer(buffer)) {
      console.log("⚠️ Скачанный файл не является текстом");
      return null;
    }

    console.log(
      `✅ ${fileType.toUpperCase()} скачан, размер: ${buffer.length} байт`,
    );
    return buffer;
  } catch (error) {
    if (error instanceof Error) {
      console.log(
        `⚠️ Ошибка скачивания ${fileType.toUpperCase()}: ${error.message}`,
      );
    }
    return null;
  }
}

export async function parseResumeExperience(
  page: Page,
  url: string,
): Promise<ResumeExperience> {
  console.log(`📄 Переход на страницу резюме: ${url}`);

  if (page.url() !== url) {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
  }

  let contacts = null;
  let phone: string | null = null;

  // Парсинг контактов (телефон)
  const resumeIdMatch = url.match(/\/resume\/([a-f0-9]+)/);
  if (resumeIdMatch?.[1] && HH_CONFIG.features.parseContacts) {
    const resumeId = resumeIdMatch[1];

    try {
      console.log(`📞 Получение контактов для резюме ${resumeId}`);

      try {
        const topicIdMatch = url.match(/[?&]t=([^&]+)/);
        const topicId = topicIdMatch?.[1] || Date.now().toString();

        const cookies = await page.browserContext().cookies();
        const cookieString = cookies
          .map((cookie) => `${cookie.name}=${cookie.value}`)
          .join("; ");

        const contactsUrl = `https://hh.ru/resume/contacts/${resumeId}?simHash=&goal=Contacts_Phone&topicId=${topicId}`;
        console.log(`📞 Запрос контактов: ${contactsUrl}`);

        const response = await axios.get(contactsUrl, {
          headers: {
            Accept: "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            Cookie: cookieString,
            Referer: url,
            "Sec-Ch-Ua":
              '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin",
            "User-Agent": HH_CONFIG.userAgent,
            "X-Requested-With": "XMLHttpRequest",
          },
          timeout: HH_CONFIG.timeouts.contacts,
        });

        contacts = response.data;
        console.log("✅ Контакты получены:", contacts);

        if (contacts && typeof contacts === "object" && "phone" in contacts) {
          const phoneData = (
            contacts as {
              phone?: Array<{ formatted?: string; raw?: string }>;
            }
          ).phone;
          if (Array.isArray(phoneData) && phoneData.length > 0) {
            const firstPhone = phoneData[0];
            phone = firstPhone?.formatted || firstPhone?.raw || null;
            if (phone) {
              console.log(`✅ Телефон: ${phone}`);
            }
          }
        }
      } catch (error) {
        console.log("⚠️ Ошибка получения контактов");
        if (error instanceof Error) {
          console.log(`   ${error.message}`);
        }
      }
    } catch {
      console.log("⚠️ Не удалось получить контакты");
    }
  }

  // Извлекаем Telegram username из контактов
  let telegramUsername: string | null = null;
  if (contacts) {
    try {
      console.log("🔍 Извлечение Telegram username из контактов...");
      telegramUsername = await extractTelegramUsername(contacts);
      if (telegramUsername) {
        console.log(`✅ Telegram username: @${telegramUsername}`);
      } else {
        console.log("⚠️ Telegram username не найден в контактах");
      }
    } catch (error) {
      console.log("⚠️ Ошибка извлечения Telegram username");
      if (error instanceof Error) {
        console.log(`   ${error.message}`);
      }
    }
  }

  // Скачиваем PDF и TXT
  let pdfBuffer: Buffer | null = null;
  let txtBuffer: Buffer | null = null;
  let resumeHtml = "";

  try {
    [pdfBuffer, txtBuffer] = await Promise.all([
      downloadResumeFile(page, url, "pdf"),
      downloadResumeFile(page, url, "txt"),
    ]);

    if (txtBuffer) {
      const fullHtml = txtBuffer.toString("utf-8");

      // Извлекаем только содержимое body
      const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      resumeHtml = bodyMatch?.[1]?.trim() ?? fullHtml;

      console.log(
        `✅ Резюме в текстовом формате получено (${resumeHtml.length} символов)`,
      );
    }
  } catch (error) {
    console.log("⚠️ Ошибка скачивания файлов резюме");
    if (error instanceof Error) {
      console.log(`   ${error.message}`);
    }
  }

  return {
    experience: resumeHtml,
    contacts,
    phone,
    telegramUsername,
    pdfBuffer,
  };
}
