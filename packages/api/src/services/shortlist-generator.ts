/**
 * Сервис генерации шортлиста кандидатов
 *
 * Ранжирует фрилансеров на основе оценок анализа откликов и интервью.
 * Комбинирует оценки с весами: 40% анализ отклика, 60% интервью.
 */

import { db } from "@qbs-autonaim/db/client";

/**
 * Контактная информация кандидата
 */
export interface ContactInfo {
  email?: string;
  phone?: string;
  telegram?: string;
  platformProfile?: string;
}

/**
 * Опции генерации шортлиста
 */
export interface ShortlistOptions {
  minScore?: number; // По умолчанию: 60
  maxCandidates?: number; // По умолчанию: 10
  sortBy?: "SCORE" | "EXPERIENCE" | "RESPONSE_DATE"; // По умолчанию: SCORE
}

/**
 * Кандидат в шортлисте
 */
export interface ShortlistCandidate {
  responseId: string;
  name: string;
  contactInfo: ContactInfo;
  overallScore: number;
  responseScore: number;
  interviewScore: number | null;
  keyHighlights: string[];
  redFlags: string[];
}

/**
 * Результат генерации шортлиста
 */
export interface Shortlist {
  vacancyId: string;
  candidates: ShortlistCandidate[];
  generatedAt: Date;
}

/**
 * Сервис для генерации шортлиста кандидатов
 */
export class ShortlistGenerator {
  /**
   * Генерирует шортлист кандидатов для вакансии
   *
   * @param vacancyId - ID вакансии
   * @param options - Опции генерации (минимальная оценка, максимум кандидатов, сортировка)
   * @returns Шортлист с ранжированными кандидатами
   */
  async generateShortlist(
    vacancyId: string,
    options: ShortlistOptions = {},
  ): Promise<Shortlist> {
    const { minScore = 60, maxCandidates = 10, sortBy = "SCORE" } = options;

    // Получаем все отклики для вакансии с оценками
    const responses = await db.query.vacancyResponse.findMany({
      where: (response, { eq }) => eq(response.vacancyId, vacancyId),
      with: {
        screening: true,
        conversation: {
          with: {
            interviewScoring: true,
          },
        },
      },
    });

    // Преобразуем в кандидатов с комбинированными оценками
    const candidates: ShortlistCandidate[] = responses
      .map((response) => {
        // Получаем оценку анализа отклика
        const responseScore = response.screening?.detailedScore ?? 0;

        // Получаем оценку интервью (если есть завершённое интервью)
        const interviewScore =
          response.conversation?.interviewScoring?.detailedScore ?? null;

        // Рассчитываем общую оценку
        const overallScore = this.calculateOverallScore(
          responseScore,
          interviewScore,
        );

        // Извлекаем контактную информацию
        const contactInfo = this.extractContactInfo(response);

        // Извлекаем ключевые особенности и красные флаги
        const { keyHighlights, redFlags } = this.extractHighlightsAndFlags(
          response.screening?.analysis,
          response.conversation?.interviewScoring?.analysis,
        );

        return {
          responseId: response.id,
          name: response.candidateName ?? "Имя не указано",
          contactInfo,
          overallScore,
          responseScore,
          interviewScore,
          keyHighlights,
          redFlags,
        };
      })
      .filter((candidate) => candidate.overallScore >= minScore);

    // Сортируем кандидатов
    const sortedCandidates = this.sortCandidates(candidates, sortBy);

    // Ограничиваем количество кандидатов
    const topCandidates = sortedCandidates.slice(0, maxCandidates);

    return {
      vacancyId,
      candidates: topCandidates,
      generatedAt: new Date(),
    };
  }

  /**
   * Рассчитывает общую оценку кандидата
   * Веса: 40% анализ отклика, 60% интервью
   * Если нет интервью, использует только оценку отклика
   */
  private calculateOverallScore(
    responseScore: number,
    interviewScore: number | null,
  ): number {
    if (interviewScore === null) {
      // Нет интервью - используем только оценку отклика
      return responseScore;
    }

    // Комбинируем оценки с весами
    const weighted = responseScore * 0.4 + interviewScore * 0.6;
    return Math.round(weighted);
  }

  /**
   * Извлекает контактную информацию из отклика
   */
  private extractContactInfo(response: {
    phone?: string | null;
    telegramUsername?: string | null;
    platformProfileUrl?: string | null;
    contacts?: Record<string, unknown> | null;
  }): ContactInfo {
    const contactInfo: ContactInfo = {};

    if (response.phone) {
      contactInfo.phone = response.phone;
    }

    if (response.telegramUsername) {
      contactInfo.telegram = response.telegramUsername;
    }

    if (response.platformProfileUrl) {
      contactInfo.platformProfile = response.platformProfileUrl;
    }

    // Извлекаем email из contacts JSONB
    if (response.contacts && typeof response.contacts === "object") {
      const email = (response.contacts as Record<string, unknown>).email;
      if (typeof email === "string") {
        contactInfo.email = email;
      }
    }

    return contactInfo;
  }

  /**
   * Извлекает ключевые особенности и красные флаги из анализов
   */
  private extractHighlightsAndFlags(
    screeningAnalysis?: string | null,
    interviewAnalysis?: string | null,
  ): { keyHighlights: string[]; redFlags: string[] } {
    const keyHighlights: string[] = [];
    const redFlags: string[] = [];

    // Простая эвристика: ищем маркеры в тексте анализа
    const combinedAnalysis = [screeningAnalysis, interviewAnalysis]
      .filter(Boolean)
      .join("\n");

    if (!combinedAnalysis) {
      return { keyHighlights, redFlags };
    }

    // Ищем позитивные маркеры
    const positivePatterns = [
      /(?:сильные стороны|преимущества|плюсы):\s*([^\n]+)/gi,
      /(?:опыт|навыки):\s*([^\n]+)/gi,
      /(?:рекомендуется|подходит)/gi,
    ];

    for (const pattern of positivePatterns) {
      const matches = combinedAnalysis.matchAll(pattern);
      for (const match of matches) {
        const highlight = match[1] || match[0];
        if (highlight && highlight.length > 10) {
          keyHighlights.push(highlight.trim());
        }
      }
    }

    // Ищем негативные маркеры
    const negativePatterns = [
      /(?:слабые стороны|недостатки|минусы):\s*([^\n]+)/gi,
      /(?:красные флаги|проблемы|риски):\s*([^\n]+)/gi,
      /(?:не рекомендуется|не подходит)/gi,
    ];

    for (const pattern of negativePatterns) {
      const matches = combinedAnalysis.matchAll(pattern);
      for (const match of matches) {
        const flag = match[1] || match[0];
        if (flag && flag.length > 10) {
          redFlags.push(flag.trim());
        }
      }
    }

    return { keyHighlights, redFlags };
  }

  /**
   * Сортирует кандидатов по выбранному критерию
   */
  private sortCandidates(
    candidates: ShortlistCandidate[],
    sortBy: "SCORE" | "EXPERIENCE" | "RESPONSE_DATE",
  ): ShortlistCandidate[] {
    const sorted = [...candidates];

    switch (sortBy) {
      case "SCORE":
        // Сортировка по общей оценке (по убыванию)
        sorted.sort((a, b) => b.overallScore - a.overallScore);
        break;

      case "EXPERIENCE":
        // Сортировка по наличию интервью и оценке интервью
        sorted.sort((a, b) => {
          // Приоритет кандидатам с завершённым интервью
          if (a.interviewScore !== null && b.interviewScore === null) return -1;
          if (a.interviewScore === null && b.interviewScore !== null) return 1;

          // Если оба с интервью или оба без, сортируем по общей оценке
          return b.overallScore - a.overallScore;
        });
        break;

      case "RESPONSE_DATE":
        // Сортировка по дате отклика (новые первыми)
        // Примечание: для этого нужна дата отклика, используем общую оценку как fallback
        sorted.sort((a, b) => b.overallScore - a.overallScore);
        break;
    }

    return sorted;
  }
}
