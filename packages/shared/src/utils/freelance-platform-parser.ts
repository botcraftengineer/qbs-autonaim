import { PlatformSource } from "@qbs-autonaim/db/schema";

export interface ParsedPlatformLink {
  source: PlatformSource;
  externalId: string | null;
  url: string;
}

/**
 * Парсер ссылок на фриланс-платформы
 * Автоматически определяет платформу и извлекает externalId из URL
 */
export class FreelancePlatformParser {
  private static readonly PLATFORM_PATTERNS = {
    KWORK: {
      pattern: /^https?:\/\/(?:www\.)?kwork\.ru\/projects\/(\d+)(?:\/.*)?$/,
      extractId: (url: string): string | null => {
        const match = url.match(
          /^https?:\/\/(?:www\.)?kwork\.ru\/projects\/(\d+)(?:\/.*)?$/
        );
        return match ? (match[1] ?? null) : null;
      },
    },
    FL_RU: {
      pattern: /^https?:\/\/(?:www\.)?fl\.ru\/projects\/(\d+)(?:\/.*)?$/,
      extractId: (url: string): string | null => {
        const match = url.match(
          /^https?:\/\/(?:www\.)?fl\.ru\/projects\/(\d+)(?:\/.*)?$/
        );
        return match ? (match[1] ?? null) : null;
      },
    },
    FREELANCE_RU: {
      pattern: /^https?:\/\/(?:www\.)?freelance\.ru\/project\/(\d+)(?:\/.*)?$/,
      extractId: (url: string): string | null => {
        const match = url.match(
          /^https?:\/\/(?:www\.)?freelance\.ru\/project\/(\d+)(?:\/.*)?$/
        );
        return match ? (match[1] ?? null) : null;
      },
    },
    HABR: {
      pattern:
        /^https?:\/\/(?:www\.)?freelance\.habr\.com\/tasks\/(\d+)(?:\/.*)?$/,
      extractId: (url: string): string | null => {
        const match = url.match(
          /^https?:\/\/(?:www\.)?freelance\.habr\.com\/tasks\/(\d+)(?:\/.*)?$/
        );
        return match ? (match[1] ?? null) : null;
      },
    },
  };

  /**
   * Парсит ссылку на фриланс-платформу
   * @param url - URL ссылки на задание
   * @returns объект с распаршенными данными или null если не удалось распарсить
   */
  static parseLink(url: string): ParsedPlatformLink | null {
    if (!url || typeof url !== "string") {
      return null;
    }

    // Нормализуем URL
    const normalizedUrl = url.trim();

    // Проверяем каждый паттерн платформы
    for (const [platform, config] of Object.entries(this.PLATFORM_PATTERNS)) {
      if (config.pattern.test(normalizedUrl)) {
        const externalId = config.extractId(normalizedUrl);
        if (externalId) {
          return {
            source: platform as PlatformSource,
            externalId,
            url: normalizedUrl,
          };
        }
      }
    }

    // Если не подошла ни одна платформа, но URL валидный - возвращаем как WEB_LINK
    try {
      new URL(normalizedUrl);
      return {
        source: "WEB_LINK",
        externalId: null,
        url: normalizedUrl,
      };
    } catch {
      return null;
    }
  }

  /**
   * Получает название платформы для отображения
   */
  static getPlatformDisplayName(source: PlatformSource): string {
    const names: Record<PlatformSource, string> = {
      MANUAL: "Ручной ввод",
      HH: "HeadHunter",
      KWORK: "KWork",
      FL_RU: "FL.ru",
      FREELANCE_RU: "Freelance.ru",
      HABR: "Habr Freelance",
      AVITO: "Avito",
      SUPERJOB: "SuperJob",
      WEB_LINK: "Другая платформа",
      TELEGRAM: "Telegram",
    };

    return names[source] || source;
  }

  /**
   * Получает URL для просмотра задания на платформе
   */
  static getPlatformTaskUrl(
    source: PlatformSource,
    externalId: string | null
  ): string | null {
    if (!externalId) return null;

    const urlTemplates: Partial<Record<PlatformSource, string>> = {
      KWORK: `https://kwork.ru/projects/${externalId}`,
      FL_RU: `https://fl.ru/projects/${externalId}`,
      FREELANCE_RU: `https://freelance.ru/project/${externalId}`,
      HABR: `https://freelance.habr.com/tasks/${externalId}`,
    };

    return urlTemplates[source] || null;
  }
}
