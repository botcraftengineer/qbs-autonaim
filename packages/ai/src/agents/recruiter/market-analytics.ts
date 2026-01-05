/**
 * Market Analytics - Сравнение вакансии с рынком труда
 * Предоставляет данные о зарплатах, конкурентах и трендах рынка
 */

import type { MarketData } from "./vacancy-analytics";

/**
 * Данные о зарплатах на рынке
 */
export interface SalaryMarketData {
  min: number;
  max: number;
  avg: number;
  median: number;
  percentile25: number;
  percentile75: number;
  currency: string;
  sampleSize: number;
  updatedAt: Date;
}

/**
 * Данные о конкурентных вакансиях
 */
export interface CompetitorVacancy {
  id: string;
  title: string;
  company: string;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  publishedAt: Date;
  responseCount?: number;
  source: "hh" | "habr" | "linkedin" | "internal";
}

/**
 * Тренды рынка
 */
export interface MarketTrend {
  period: "week" | "month" | "quarter";
  vacancyGrowth: number; // процент изменения количества вакансий
  salaryGrowth: number; // процент изменения зарплат
  demandIndex: number; // индекс спроса (0-100)
  supplyIndex: number; // индекс предложения (0-100)
}

/**
 * Полные данные рынка
 */
export interface FullMarketData extends MarketData {
  salary: SalaryMarketData;
  competitors: CompetitorVacancy[];
  trends: MarketTrend;
  lastUpdated: Date;
}

/**
 * Параметры запроса рыночных данных
 */
export interface MarketDataQuery {
  position: string;
  skills?: string[];
  experience?: number; // в годах
  location?: string;
  remote?: boolean;
}

/**
 * Результат сравнения с рынком
 */
export interface MarketComparisonResult {
  salaryPercentile: number;
  salaryDiff: number; // разница с медианой рынка
  salaryDiffPercent: number;
  competitorCount: number;
  avgCompetitorSalary: number;
  marketPosition: "below" | "average" | "above" | "top";
  recommendations: string[];
}

/**
 * MarketAnalyticsService - Сервис для получения и анализа рыночных данных
 *
 * В production версии интегрируется с:
 * - hh.ru API для данных о вакансиях и зарплатах
 * - Habr Career API
 * - Внутренней базой данных с историческими данными
 */
export class MarketAnalyticsService {
  private cache: Map<string, { data: FullMarketData; expiresAt: Date }> =
    new Map();
  private cacheTTL: number;

  constructor(options?: { cacheTTLMinutes?: number }) {
    this.cacheTTL = (options?.cacheTTLMinutes || 60) * 60 * 1000;
  }

  /**
   * Получает рыночные данные для позиции
   */
  async getMarketData(query: MarketDataQuery): Promise<FullMarketData> {
    const cacheKey = this.buildCacheKey(query);
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      return cached.data;
    }

    // В production здесь будет запрос к внешним API
    // Пока используем mock данные на основе позиции
    const data = await this.fetchMarketData(query);

    this.cache.set(cacheKey, {
      data,
      expiresAt: new Date(Date.now() + this.cacheTTL),
    });

    return data;
  }

  /**
   * Сравнивает вакансию с рынком
   */
  async compareWithMarket(
    query: MarketDataQuery,
    vacancySalaryFrom?: number,
    vacancySalaryTo?: number,
  ): Promise<MarketComparisonResult> {
    const marketData = await this.getMarketData(query);
    const vacancySalary = vacancySalaryTo || vacancySalaryFrom;

    if (!vacancySalary) {
      return {
        salaryPercentile: 0,
        salaryDiff: 0,
        salaryDiffPercent: 0,
        competitorCount: marketData.competitorVacancies,
        avgCompetitorSalary: marketData.avgSalary,
        marketPosition: "below",
        recommendations: [
          "Укажите зарплатную вилку — вакансии с зарплатой получают на 30-50% больше откликов",
        ],
      };
    }

    const salaryDiff = vacancySalary - marketData.medianSalary;
    const salaryDiffPercent = Math.round(
      (salaryDiff / marketData.medianSalary) * 100,
    );
    const salaryPercentile = this.calculatePercentile(
      vacancySalary,
      marketData.salary,
    );

    const marketPosition = this.determineMarketPosition(salaryPercentile);
    const recommendations = this.generateSalaryRecommendations(
      salaryPercentile,
      salaryDiff,
      marketData,
    );

    return {
      salaryPercentile,
      salaryDiff,
      salaryDiffPercent,
      competitorCount: marketData.competitorVacancies,
      avgCompetitorSalary: marketData.avgSalary,
      marketPosition,
      recommendations,
    };
  }

  /**
   * Получает конкурентные вакансии
   */
  async getCompetitorVacancies(
    query: MarketDataQuery,
    limit = 10,
  ): Promise<CompetitorVacancy[]> {
    const marketData = await this.getMarketData(query);
    return marketData.competitors.slice(0, limit);
  }

  /**
   * Получает тренды рынка
   */
  async getMarketTrends(query: MarketDataQuery): Promise<MarketTrend> {
    const marketData = await this.getMarketData(query);
    return marketData.trends;
  }

  /**
   * Строит ключ кэша
   */
  private buildCacheKey(query: MarketDataQuery): string {
    const parts = [
      query.position.toLowerCase().trim(),
      query.location || "any",
      query.remote ? "remote" : "office",
      query.experience?.toString() || "any",
      ...(query.skills || []).sort(),
    ];
    return parts.join("::");
  }

  /**
   * Получает данные с внешних источников (mock для MVP)
   */
  private async fetchMarketData(
    query: MarketDataQuery,
  ): Promise<FullMarketData> {
    // Определяем базовые зарплаты по позиции
    const salaryRanges = this.getSalaryRangesByPosition(query.position);

    // Корректируем на опыт
    const experienceMultiplier = this.getExperienceMultiplier(query.experience);

    // Корректируем на локацию
    const locationMultiplier = this.getLocationMultiplier(query.location);

    const multiplier = experienceMultiplier * locationMultiplier;

    const salary: SalaryMarketData = {
      min: Math.round(salaryRanges.min * multiplier),
      max: Math.round(salaryRanges.max * multiplier),
      avg: Math.round(salaryRanges.avg * multiplier),
      median: Math.round(salaryRanges.median * multiplier),
      percentile25: Math.round(salaryRanges.percentile25 * multiplier),
      percentile75: Math.round(salaryRanges.percentile75 * multiplier),
      currency: "RUB",
      sampleSize: 150 + Math.floor(Math.random() * 100),
      updatedAt: new Date(),
    };

    // Генерируем конкурентные вакансии
    const competitors = this.generateMockCompetitors(query, salary);

    // Генерируем тренды
    const trends = this.generateMockTrends(query);

    return {
      avgSalary: salary.avg,
      medianSalary: salary.median,
      competitorVacancies: competitors.length + Math.floor(Math.random() * 30),
      avgResponseRate: 2 + Math.random() * 3,
      salary,
      competitors,
      trends,
      lastUpdated: new Date(),
    };
  }

  /**
   * Получает диапазоны зарплат по позиции
   */
  private getSalaryRangesByPosition(position: string): SalaryMarketData {
    const positionLower = position.toLowerCase();

    // Базовые зарплаты для разных позиций (в рублях)
    const salaryMap: Record<
      string,
      Omit<SalaryMarketData, "currency" | "sampleSize" | "updatedAt">
    > = {
      // Разработка
      frontend: {
        min: 100000,
        max: 350000,
        avg: 200000,
        median: 180000,
        percentile25: 140000,
        percentile75: 260000,
      },
      backend: {
        min: 120000,
        max: 400000,
        avg: 230000,
        median: 210000,
        percentile25: 160000,
        percentile75: 300000,
      },
      fullstack: {
        min: 130000,
        max: 420000,
        avg: 250000,
        median: 230000,
        percentile25: 180000,
        percentile75: 320000,
      },
      mobile: {
        min: 140000,
        max: 400000,
        avg: 240000,
        median: 220000,
        percentile25: 170000,
        percentile75: 310000,
      },
      devops: {
        min: 150000,
        max: 450000,
        avg: 270000,
        median: 250000,
        percentile25: 190000,
        percentile75: 350000,
      },
      qa: {
        min: 80000,
        max: 280000,
        avg: 160000,
        median: 145000,
        percentile25: 110000,
        percentile75: 210000,
      },

      // Дизайн
      designer: {
        min: 80000,
        max: 300000,
        avg: 170000,
        median: 155000,
        percentile25: 120000,
        percentile75: 220000,
      },
      ux: {
        min: 100000,
        max: 350000,
        avg: 200000,
        median: 180000,
        percentile25: 140000,
        percentile75: 260000,
      },

      // Менеджмент
      pm: {
        min: 120000,
        max: 400000,
        avg: 230000,
        median: 210000,
        percentile25: 160000,
        percentile75: 300000,
      },
      product: {
        min: 150000,
        max: 500000,
        avg: 290000,
        median: 260000,
        percentile25: 200000,
        percentile75: 380000,
      },

      // Аналитика
      analyst: {
        min: 100000,
        max: 350000,
        avg: 200000,
        median: 180000,
        percentile25: 140000,
        percentile75: 260000,
      },
      data: {
        min: 140000,
        max: 450000,
        avg: 260000,
        median: 240000,
        percentile25: 180000,
        percentile75: 340000,
      },

      // HR
      hr: {
        min: 70000,
        max: 200000,
        avg: 120000,
        median: 110000,
        percentile25: 85000,
        percentile75: 155000,
      },
      recruiter: {
        min: 80000,
        max: 250000,
        avg: 140000,
        median: 125000,
        percentile25: 95000,
        percentile75: 185000,
      },

      // Default
      default: {
        min: 100000,
        max: 300000,
        avg: 180000,
        median: 165000,
        percentile25: 130000,
        percentile75: 230000,
      },
    };

    // Ищем подходящую категорию
    for (const [key, value] of Object.entries(salaryMap)) {
      if (key !== "default" && positionLower.includes(key)) {
        return {
          ...value,
          currency: "RUB",
          sampleSize: 0,
          updatedAt: new Date(),
        };
      }
    }

    // Default fallback - используем явное значение
    return {
      min: 100000,
      max: 300000,
      avg: 180000,
      median: 165000,
      percentile25: 130000,
      percentile75: 230000,
      currency: "RUB",
      sampleSize: 0,
      updatedAt: new Date(),
    };
  }

  /**
   * Получает множитель для опыта
   */
  private getExperienceMultiplier(experience?: number): number {
    if (!experience) return 1;
    if (experience < 1) return 0.7;
    if (experience < 2) return 0.85;
    if (experience < 3) return 1;
    if (experience < 5) return 1.2;
    if (experience < 7) return 1.4;
    return 1.6;
  }

  /**
   * Получает множитель для локации
   */
  private getLocationMultiplier(location?: string): number {
    if (!location) return 1;
    const locationLower = location.toLowerCase();

    if (locationLower.includes("москва") || locationLower.includes("moscow")) {
      return 1.3;
    }
    if (
      locationLower.includes("петербург") ||
      locationLower.includes("spb") ||
      locationLower.includes("petersburg")
    ) {
      return 1.15;
    }
    if (locationLower.includes("remote") || locationLower.includes("удалён")) {
      return 1.1;
    }

    return 1;
  }

  /**
   * Генерирует mock конкурентные вакансии
   */
  private generateMockCompetitors(
    query: MarketDataQuery,
    salary: SalaryMarketData,
  ): CompetitorVacancy[] {
    const companies = [
      "Яндекс",
      "VK",
      "Сбер",
      "Тинькофф",
      "Авито",
      "Ozon",
      "Wildberries",
      "МТС",
      "Мегафон",
      "Kaspersky",
      "JetBrains",
      "EPAM",
      "Luxoft",
      "DataArt",
      "Playrix",
    ];

    const count = 5 + Math.floor(Math.random() * 10);
    const competitors: CompetitorVacancy[] = [];

    for (let i = 0; i < count; i++) {
      const salaryVariation = 0.8 + Math.random() * 0.4;
      const baseSalary = salary.median * salaryVariation;

      competitors.push({
        id: `comp-${i}`,
        title: this.generateVacancyTitle(query.position),
        company:
          companies[Math.floor(Math.random() * companies.length)] || "Unknown",
        salaryFrom: Math.round(baseSalary * 0.85),
        salaryTo: Math.round(baseSalary * 1.15),
        currency: "RUB",
        publishedAt: new Date(
          Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
        ),
        responseCount: Math.floor(Math.random() * 50),
        source: Math.random() > 0.3 ? "hh" : "habr",
      });
    }

    return competitors.sort(
      (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
    );
  }

  /**
   * Генерирует заголовок вакансии
   */
  private generateVacancyTitle(position: string): string {
    const prefixes = ["Senior", "Middle", "Junior", "Lead", ""];
    const suffixes = ["Developer", "Engineer", "Specialist", ""];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return [prefix, position, suffix].filter(Boolean).join(" ").trim();
  }

  /**
   * Генерирует mock тренды рынка
   */
  private generateMockTrends(_query: MarketDataQuery): MarketTrend {
    return {
      period: "month",
      vacancyGrowth: -5 + Math.random() * 15, // от -5% до +10%
      salaryGrowth: Math.random() * 8, // от 0% до +8%
      demandIndex: 40 + Math.random() * 40, // от 40 до 80
      supplyIndex: 30 + Math.random() * 50, // от 30 до 80
    };
  }

  /**
   * Рассчитывает процентиль зарплаты
   */
  private calculatePercentile(
    salary: number,
    marketSalary: SalaryMarketData,
  ): number {
    if (salary <= marketSalary.min) return 0;
    if (salary >= marketSalary.max) return 100;

    // Линейная интерполяция между известными точками
    const points = [
      { percentile: 0, salary: marketSalary.min },
      { percentile: 25, salary: marketSalary.percentile25 },
      { percentile: 50, salary: marketSalary.median },
      { percentile: 75, salary: marketSalary.percentile75 },
      { percentile: 100, salary: marketSalary.max },
    ];

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];

      if (
        current &&
        next &&
        salary >= current.salary &&
        salary <= next.salary
      ) {
        const ratio =
          (salary - current.salary) / (next.salary - current.salary);
        return Math.round(
          current.percentile + ratio * (next.percentile - current.percentile),
        );
      }
    }

    return 50;
  }

  /**
   * Определяет позицию на рынке
   */
  private determineMarketPosition(
    percentile: number,
  ): "below" | "average" | "above" | "top" {
    if (percentile < 25) return "below";
    if (percentile < 50) return "average";
    if (percentile < 75) return "above";
    return "top";
  }

  /**
   * Генерирует рекомендации по зарплате
   */
  private generateSalaryRecommendations(
    percentile: number,
    salaryDiff: number,
    marketData: FullMarketData,
  ): string[] {
    const recommendations: string[] = [];

    if (percentile < 25) {
      recommendations.push(
        `Зарплата ниже 75% рынка. Рекомендуем повысить минимум до ${Math.round(marketData.salary.percentile25 / 1000) * 1000} ₽`,
      );
      recommendations.push(
        "Низкая зарплата может привести к откликам только от junior специалистов",
      );
    } else if (percentile < 50) {
      recommendations.push(
        `Зарплата ниже медианы рынка на ${Math.abs(Math.round(salaryDiff / 1000))}K ₽`,
      );
      recommendations.push(
        "Для привлечения опытных кандидатов рассмотрите повышение до медианы",
      );
    } else if (percentile >= 75) {
      recommendations.push(
        "Зарплата выше 75% рынка — отличное предложение для привлечения топ-кандидатов",
      );
    }

    if (marketData.trends.demandIndex > 60 && percentile < 50) {
      recommendations.push(
        "Высокий спрос на рынке — конкуренция за кандидатов высокая",
      );
    }

    if (marketData.competitorVacancies > 30) {
      recommendations.push(
        `На рынке ${marketData.competitorVacancies} похожих вакансий — важно выделиться`,
      );
    }

    return recommendations;
  }

  /**
   * Очищает кэш
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * Singleton инстанс сервиса
 */
let marketAnalyticsServiceInstance: MarketAnalyticsService | null = null;

/**
 * Получает singleton инстанс MarketAnalyticsService
 */
export function getMarketAnalyticsService(): MarketAnalyticsService {
  if (!marketAnalyticsServiceInstance) {
    marketAnalyticsServiceInstance = new MarketAnalyticsService();
  }
  return marketAnalyticsServiceInstance;
}

/**
 * Хелпер для быстрого получения рыночных данных
 */
export async function getMarketDataForVacancy(
  position: string,
  options?: {
    skills?: string[];
    experience?: number;
    location?: string;
    remote?: boolean;
  },
): Promise<MarketData> {
  const service = getMarketAnalyticsService();
  const fullData = await service.getMarketData({
    position,
    ...options,
  });

  return {
    avgSalary: fullData.avgSalary,
    medianSalary: fullData.medianSalary,
    competitorVacancies: fullData.competitorVacancies,
    avgResponseRate: fullData.avgResponseRate,
  };
}

/**
 * Хелпер для сравнения зарплаты с рынком
 */
export async function compareSalaryWithMarket(
  position: string,
  salaryFrom?: number,
  salaryTo?: number,
  options?: {
    skills?: string[];
    experience?: number;
    location?: string;
  },
): Promise<MarketComparisonResult> {
  const service = getMarketAnalyticsService();
  return service.compareWithMarket(
    { position, ...options },
    salaryFrom,
    salaryTo,
  );
}
