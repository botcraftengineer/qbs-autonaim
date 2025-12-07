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

      const phoneLink = await page.$(
        'a[data-qa="response-resume_show-phone-number"]',
      );

      if (phoneLink) {
        let responseHandler:
          | ((response: {
              url: () => string;
              json: () => Promise<unknown>;
            }) => Promise<void>)
          | null = null;

        const contactsPromise = new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (responseHandler) {
              page.off("response", responseHandler);
            }
            console.log("⚠️ Таймаут ожидания контактов");
            resolve(null);
          }, HH_CONFIG.timeouts.contacts);

          responseHandler = async (response: {
            url: () => string;
            json: () => Promise<unknown>;
          }) => {
            try {
              const url = response.url();
              if (
                url.includes(`/resume/contacts/${resumeId}`) &&
                url.includes("goal=Contacts_Phone")
              ) {
                clearTimeout(timeout);
                if (responseHandler) {
                  page.off("response", responseHandler);
                }
                try {
                  const data = await response.json();
                  resolve(data);
                } catch {
                  resolve(null);
                }
              }
            } catch {
              // Игнорируем ошибки
            }
          };

          page.on("response", responseHandler);
        });

        try {
          await new Promise((resolve) => setTimeout(resolve, 500));
          await phoneLink.click();
          contacts = await contactsPromise;

          if (responseHandler) {
            page.off("response", responseHandler);
          }

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
        } catch {
          console.log("⚠️ Ошибка получения контактов");
          if (responseHandler) {
            page.off("response", responseHandler);
          }
        }
      }
    } catch {
      console.log("⚠️ Не удалось получить контакты");
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
    pdfBuffer,
  };
}
