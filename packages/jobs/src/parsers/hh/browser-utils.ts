import type { Browser } from "puppeteer";

/**
 * Безопасно закрывает браузер Puppeteer с обработкой ошибок
 *
 * Последовательность действий:
 * 1. Закрывает все открытые страницы (с индивидуальной обработкой ошибок)
 * 2. Закрывает сам браузер
 * 3. Ждет 1 секунду для освобождения файловых дескрипторов (важно для Windows)
 * 4. При ошибке принудительно завершает процесс браузера через SIGKILL
 *
 * @param browser - Экземпляр Puppeteer Browser для закрытия
 */
export async function closeBrowserSafely(browser: Browser): Promise<void> {
  try {
    const pages = await browser.pages();

    // Закрываем каждую страницу по отдельности, игнорируя ошибки
    await Promise.all(
      pages.map(async (page) => {
        try {
          if (!page.isClosed()) {
            await page.close();
          }
        } catch {
          // Игнорируем ошибки закрытия отдельных страниц
        }
      }),
    );

    await browser.close();

    // Даем Windows время для освобождения файловых дескрипторов
    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (closeError) {
    console.warn("⚠️ Ошибка при закрытии браузера:", closeError);

    // Принудительно завершаем процесс браузера, если обычное закрытие не сработало
    try {
      browser.process()?.kill("SIGKILL");
    } catch {
      // Игнорируем, если процесс уже закрыт
    }
  }
}
