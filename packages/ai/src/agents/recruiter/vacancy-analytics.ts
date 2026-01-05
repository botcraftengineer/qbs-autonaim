/**
 * VacancyAnalyticsAgent - Агент для анализа эффективности вакансий
 * Выполняет анализ вакансии, выявляет проблемы и формирует рекомендации
 */

import { z } from "zod";
import type { AgentConfig } from "../base-agent";
import { BaseAgent } from "../base-agent";
import { AgentType } from "../types";
import { getMarketAnalyticsService } from "./market-analytics";
import type {
  RecruiterAgentContext,
  VacancyAnalytics,
  VacancyIssue,
  VacancyRecommendation,
} from "./types";

/**
 * Входные данные для анализа вакансии
 */
export interface VacancyAnalyticsInput {
  vacancyId: string;
  question?: string; // "Почему мало откликов?"
}

/**
 * Выходные данные анализа вакансии
 */
export interface VacancyAnalyticsOutput {
  analysis: VacancyAnalytics;
  summary: string;
  suggestions: string[];
}

/**
 * Данные вакансии из базы данных
 */
export interface VacancyData {
  id: string;
  title: string;
  description?: string;
  requirements?: string;
  salaryFrom?: number;
  salaryTo?: number;
  currency?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  workspaceId: string;
}

/**
 * Метрики откликов вакансии
 */
export interface VacancyMetricsData {
  totalResponses: number;
  processedResponses: number;
  highScoreResponses: number;
  topScoreResponses: number;
  avgScore: number;
}

/**
 * Данные рынка для сравнения
 */
export interface MarketData {
  avgSalary: number;
  medianSalary: number;
  competitorVacancies: number;
  avgResponseRate: number;
}

/**
 * Схема вывода для LLM
 */
const vacancyAnalyticsOutputSchema = z.object({
  analysis: z.object({
    vacancyId: z.string(),
    metrics: z.object({
      totalResponses: z.number(),
      processedResponses: z.number(),
      highScoreResponses: z.number(),
      avgScore: z.number(),
      conversionRate: z.number(),
    }),
    marketComparison: z.object({
      salaryPercentile: z.number(),
      requirementsComplexity: z.number(),
      competitorVacancies: z.number(),
      avgMarketSalary: z.number(),
    }),
    issues: z.array(
      z.object({
        type: z.enum([
          "salary",
          "requirements",
          "description",
          "timing",
          "competition",
        ]),
        severity: z.enum(["low", "medium", "high"]),
        title: z.string(),
        description: z.string(),
        impact: z.string(),
      }),
    ),
    recommendations: z.array(
      z.object({
        type: z.enum([
          "change_title",
          "adjust_salary",
          "simplify_requirements",
          "improve_description",
        ]),
        title: z.string(),
        description: z.string(),
        expectedImpact: z.string(),
        priority: z.number(),
      }),
    ),
  }),
  summary: z.string(),
  suggestions: z.array(z.string()),
});

/**
 * Инструкции для агента анализа вакансий
 */
const VACANCY_ANALYTICS_INSTRUCTIONS = `Ты - AI-ассистент рекрутера, специализирующийся на анализе эффективности вакансий.

Твоя задача:
1. Проанализировать метрики вакансии (отклики, конверсия, средний скоринг)
2. Сравнить вакансию с рынком (зарплата, требования, конкуренты)
3. Выявить проблемы и их причины
4. Предложить конкретные рекомендации по улучшению

Типы проблем:
- salary: зарплата ниже рынка или не указана
- requirements: слишком высокие или нечёткие требования
- description: неинформативное или слишком длинное описание
- timing: неудачное время публикации
- competition: высокая конкуренция в нише

Уровни серьёзности:
- low: незначительное влияние на отклики
- medium: заметное влияние, рекомендуется исправить
- high: критическое влияние, требует немедленного внимания

Типы рекомендаций:
- change_title: изменить заголовок для лучшей видимости
- adjust_salary: скорректировать зарплатную вилку
- simplify_requirements: упростить или уточнить требования
- improve_description: улучшить описание вакансии

Правила анализа:
- Каждая проблема должна иметь причинно-следственное объяснение
- Каждая рекомендация должна быть конкретной и actionable
- Приоритет рекомендаций: 1 = высший, 5 = низший
- Если responseRate < 2%, это критическая проблема
- Если avgScore < 3, качество откликов низкое`;

/**
 * Агент для анализа вакансий
 */
export class VacancyAnalyticsAgent extends BaseAgent<
  VacancyAnalyticsInput,
  VacancyAnalyticsOutput
> {
  constructor(config: AgentConfig) {
    super(
      "VacancyAnalyticsAgent",
      AgentType.VACANCY_ANALYTICS,
      VACANCY_ANALYTICS_INSTRUCTIONS,
      vacancyAnalyticsOutputSchema,
      config,
    );
  }

  protected validate(input: VacancyAnalyticsInput): boolean {
    return typeof input.vacancyId === "string" && input.vacancyId.length > 0;
  }

  protected buildPrompt(
    input: VacancyAnalyticsInput,
    context: RecruiterAgentContext,
  ): string {
    const historyContext = this.buildHistoryContext(context);

    return `
Запрос рекрутера: "${input.question || "Проанализируй эффективность вакансии"}"

Вакансия ID: ${input.vacancyId}
${context.currentVacancyId ? `Текущая вакансия в контексте: ${context.currentVacancyId}` : ""}

${historyContext}

Настройки компании:
- Название: ${context.recruiterCompanySettings?.name || "Не указано"}
- Стиль коммуникации: ${context.recruiterCompanySettings?.communicationStyle || "professional"}

Проанализируй вакансию и верни структурированный результат с:
1. Метриками эффективности
2. Сравнением с рынком
3. Выявленными проблемами
4. Конкретными рекомендациями по улучшению
`;
  }

  /**
   * Строит контекст из истории диалога
   */
  private buildHistoryContext(context: RecruiterAgentContext): string {
    if (
      !context.recruiterConversationHistory ||
      context.recruiterConversationHistory.length === 0
    ) {
      return "";
    }

    const recentHistory = context.recruiterConversationHistory.slice(-5);
    const historyText = recentHistory
      .map(
        (msg) => `${msg.role === "user" ? "Рекрутер" : "AI"}: ${msg.content}`,
      )
      .join("\n");

    return `
Контекст диалога (последние сообщения):
${historyText}
`;
  }

  /**
   * Выполняет анализ вакансии с использованием данных из БД
   * Этот метод предназначен для интеграции с реальными данными
   */
  async analyzeWithData(
    input: VacancyAnalyticsInput,
    _context: RecruiterAgentContext,
    vacancyData: VacancyData,
    metricsData: VacancyMetricsData,
    marketData?: MarketData,
  ): Promise<{
    success: boolean;
    data?: VacancyAnalyticsOutput;
    error?: string;
  }> {
    // Рассчитываем метрики
    const conversionRate = this.calculateConversionRate(metricsData);
    const salaryPercentile = this.calculateSalaryPercentile(
      vacancyData,
      marketData,
    );
    const requirementsComplexity = this.analyzeRequirementsComplexity(
      vacancyData.requirements,
    );

    // Выявляем проблемы
    const issues = this.detectIssues(
      vacancyData,
      metricsData,
      marketData,
      conversionRate,
      salaryPercentile,
      requirementsComplexity,
    );

    // Генерируем рекомендации на основе проблем
    const recommendations = this.generateRecommendations(issues, vacancyData);

    // Формируем аналитику
    const analysis: VacancyAnalytics = {
      vacancyId: input.vacancyId,
      metrics: {
        totalResponses: metricsData.totalResponses,
        processedResponses: metricsData.processedResponses,
        highScoreResponses: metricsData.highScoreResponses,
        avgScore: metricsData.avgScore,
        conversionRate,
      },
      marketComparison: {
        salaryPercentile,
        requirementsComplexity,
        competitorVacancies: marketData?.competitorVacancies || 0,
        avgMarketSalary: marketData?.avgSalary || 0,
      },
      issues,
      recommendations,
    };

    // Формируем summary
    const summary = this.buildSummary(analysis, vacancyData, input.question);

    // Формируем suggestions
    const suggestions = this.buildSuggestions(recommendations);

    return {
      success: true,
      data: {
        analysis,
        summary,
        suggestions,
      },
    };
  }

  /**
   * Рассчитывает конверсию откликов
   */
  private calculateConversionRate(metrics: VacancyMetricsData): number {
    if (metrics.totalResponses === 0) {
      return 0;
    }
    return (
      Math.round(
        (metrics.highScoreResponses / metrics.totalResponses) * 100 * 10,
      ) / 10
    );
  }

  /**
   * Рассчитывает процентиль зарплаты относительно рынка
   */
  private calculateSalaryPercentile(
    vacancy: VacancyData,
    marketData?: MarketData,
  ): number {
    if (!marketData || !marketData.avgSalary) {
      return 50; // Нет данных - предполагаем средний уровень
    }

    const vacancySalary = vacancy.salaryTo || vacancy.salaryFrom;
    if (!vacancySalary) {
      return 0; // Зарплата не указана
    }

    // Простой расчёт процентиля
    const ratio = vacancySalary / marketData.avgSalary;
    const percentile = Math.min(100, Math.max(0, Math.round(ratio * 50)));

    return percentile;
  }

  /**
   * Анализирует сложность требований
   * Возвращает значение от 0 до 100 (0 = простые, 100 = очень сложные)
   */
  private analyzeRequirementsComplexity(requirements?: string): number {
    if (!requirements) {
      return 0;
    }

    let complexity = 0;

    // Длина требований
    if (requirements.length > 2000) {
      complexity += 30;
    } else if (requirements.length > 1000) {
      complexity += 15;
    }

    // Количество пунктов (предполагаем маркеры списка)
    const bulletPoints = (requirements.match(/[-•*]\s/g) || []).length;
    if (bulletPoints > 15) {
      complexity += 25;
    } else if (bulletPoints > 10) {
      complexity += 15;
    } else if (bulletPoints > 5) {
      complexity += 5;
    }

    // Наличие "обязательно", "must have", "required"
    const mustHaveCount = (
      requirements.match(/обязательн|must\s*have|required/gi) || []
    ).length;
    complexity += Math.min(20, mustHaveCount * 5);

    // Наличие конкретных технологий/навыков
    const techKeywords = (
      requirements.match(
        /\b(java|python|react|node|sql|aws|docker|kubernetes|typescript|javascript|c\+\+|golang|rust)\b/gi,
      ) || []
    ).length;
    complexity += Math.min(15, techKeywords * 3);

    // Требования к опыту
    const experienceMatch = requirements.match(/(\d+)\+?\s*(лет|год|years?)/i);
    if (experienceMatch?.[1]) {
      const years = parseInt(experienceMatch[1], 10);
      if (years >= 5) {
        complexity += 15;
      } else if (years >= 3) {
        complexity += 10;
      }
    }

    return Math.min(100, complexity);
  }

  /**
   * Выявляет проблемы вакансии
   */
  private detectIssues(
    vacancy: VacancyData,
    metrics: VacancyMetricsData,
    marketData: MarketData | undefined,
    conversionRate: number,
    salaryPercentile: number,
    requirementsComplexity: number,
  ): VacancyIssue[] {
    const issues: VacancyIssue[] = [];

    // Проблема с зарплатой
    if (!vacancy.salaryFrom && !vacancy.salaryTo) {
      issues.push({
        type: "salary",
        severity: "high",
        title: "Зарплата не указана",
        description:
          "Вакансии без указания зарплаты получают на 30-50% меньше откликов",
        impact:
          "Кандидаты пропускают вакансию при поиске с фильтром по зарплате",
      });
    } else if (salaryPercentile < 30 && marketData) {
      issues.push({
        type: "salary",
        severity: "high",
        title: "Зарплата ниже рынка",
        description: `Предлагаемая зарплата находится в ${salaryPercentile} процентиле рынка (средняя по рынку: ${marketData.avgSalary})`,
        impact:
          "Опытные кандидаты выбирают более высокооплачиваемые предложения",
      });
    } else if (salaryPercentile < 50 && marketData) {
      issues.push({
        type: "salary",
        severity: "medium",
        title: "Зарплата ниже среднего по рынку",
        description: `Предлагаемая зарплата находится в ${salaryPercentile} процентиле рынка`,
        impact: "Может ограничивать пул кандидатов",
      });
    }

    // Проблема с требованиями
    if (requirementsComplexity > 70) {
      issues.push({
        type: "requirements",
        severity: "high",
        title: "Слишком высокие требования",
        description:
          "Список требований очень длинный и содержит много обязательных пунктов",
        impact:
          "Кандидаты не откликаются, если не соответствуют всем требованиям",
      });
    } else if (requirementsComplexity > 50) {
      issues.push({
        type: "requirements",
        severity: "medium",
        title: "Требования выше среднего",
        description: "Список требований достаточно обширный",
        impact: "Может отпугивать потенциально подходящих кандидатов",
      });
    }

    // Проблема с описанием
    if (!vacancy.description || vacancy.description.length < 200) {
      issues.push({
        type: "description",
        severity: "medium",
        title: "Недостаточное описание",
        description: "Описание вакансии слишком короткое или отсутствует",
        impact: "Кандидаты не понимают суть работы и условия",
      });
    } else if (vacancy.description.length > 5000) {
      issues.push({
        type: "description",
        severity: "low",
        title: "Слишком длинное описание",
        description: "Описание вакансии превышает 5000 символов",
        impact: "Кандидаты могут не дочитать до конца",
      });
    }

    // Проблема с конверсией
    if (metrics.totalResponses > 10 && conversionRate < 10) {
      issues.push({
        type: "requirements",
        severity: "medium",
        title: "Низкое качество откликов",
        description: `Только ${conversionRate}% откликов имеют высокий скоринг`,
        impact: "Много времени тратится на нерелевантных кандидатов",
      });
    }

    // Проблема с конкуренцией
    if (marketData && marketData.competitorVacancies > 50) {
      issues.push({
        type: "competition",
        severity: "medium",
        title: "Высокая конкуренция",
        description: `На рынке ${marketData.competitorVacancies} похожих вакансий`,
        impact: "Кандидаты имеют много альтернатив",
      });
    }

    // Проблема с откликами
    if (metrics.totalResponses === 0) {
      const daysSinceCreation = Math.floor(
        (Date.now() - vacancy.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceCreation > 7) {
        issues.push({
          type: "timing",
          severity: "high",
          title: "Нет откликов",
          description: `Вакансия опубликована ${daysSinceCreation} дней назад, но откликов нет`,
          impact: "Вакансия не видна целевой аудитории или неинтересна",
        });
      }
    } else if (metrics.totalResponses < 5) {
      const daysSinceCreation = Math.floor(
        (Date.now() - vacancy.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceCreation > 14) {
        issues.push({
          type: "timing",
          severity: "medium",
          title: "Мало откликов",
          description: `За ${daysSinceCreation} дней получено только ${metrics.totalResponses} откликов`,
          impact: "Темп набора кандидатов слишком низкий",
        });
      }
    }

    // Сортируем по серьёзности
    const severityOrder = { high: 0, medium: 1, low: 2 };
    issues.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    return issues;
  }

  /**
   * Генерирует рекомендации на основе выявленных проблем
   */
  private generateRecommendations(
    issues: VacancyIssue[],
    vacancy: VacancyData,
  ): VacancyRecommendation[] {
    const recommendations: VacancyRecommendation[] = [];
    let priority = 1;

    for (const issue of issues) {
      const recommendation = this.issueToRecommendation(
        issue,
        vacancy,
        priority,
      );
      if (recommendation) {
        recommendations.push(recommendation);
        priority++;
      }
    }

    return recommendations;
  }

  /**
   * Преобразует проблему в рекомендацию
   */
  private issueToRecommendation(
    issue: VacancyIssue,
    vacancy: VacancyData,
    priority: number,
  ): VacancyRecommendation | null {
    switch (issue.type) {
      case "salary":
        if (issue.title.includes("не указана")) {
          return {
            type: "adjust_salary",
            title: "Укажите зарплатную вилку",
            description:
              "Добавьте диапазон зарплаты в вакансию. Даже широкий диапазон лучше, чем отсутствие информации.",
            expectedImpact: "Увеличение откликов на 30-50%",
            priority,
          };
        }
        return {
          type: "adjust_salary",
          title: "Пересмотрите зарплатное предложение",
          description:
            "Рассмотрите возможность повышения зарплаты до рыночного уровня или добавьте информацию о бонусах и льготах.",
          expectedImpact: "Привлечение более квалифицированных кандидатов",
          priority,
        };

      case "requirements":
        if (issue.title.includes("высокие")) {
          return {
            type: "simplify_requirements",
            title: "Упростите требования",
            description:
              "Разделите требования на обязательные и желательные. Сократите список обязательных до 5-7 ключевых пунктов.",
            expectedImpact: "Увеличение пула кандидатов на 20-40%",
            priority,
          };
        }
        if (issue.title.includes("качество")) {
          return {
            type: "simplify_requirements",
            title: "Уточните требования",
            description:
              "Добавьте более конкретные критерии отбора, чтобы привлечь релевантных кандидатов.",
            expectedImpact: "Повышение качества откликов",
            priority,
          };
        }
        return null;

      case "description":
        if (issue.title.includes("Недостаточное")) {
          return {
            type: "improve_description",
            title: "Расширьте описание вакансии",
            description: `Добавьте информацию о: задачах, команде, технологиях, условиях работы, возможностях роста. Текущая длина: ${vacancy.description?.length || 0} символов.`,
            expectedImpact: "Повышение интереса кандидатов",
            priority,
          };
        }
        return {
          type: "improve_description",
          title: "Сократите описание",
          description:
            "Выделите ключевую информацию, уберите повторы. Оптимальная длина: 1500-3000 символов.",
          expectedImpact: "Улучшение читаемости",
          priority,
        };

      case "timing":
        return {
          type: "change_title",
          title: "Обновите заголовок вакансии",
          description:
            "Попробуйте более привлекательный заголовок с ключевыми словами, которые ищут кандидаты.",
          expectedImpact: "Повышение видимости в поиске",
          priority,
        };

      case "competition":
        return {
          type: "improve_description",
          title: "Выделите уникальные преимущества",
          description:
            "Добавьте в описание то, что отличает вашу компанию от конкурентов: культура, проекты, технологии, льготы.",
          expectedImpact: "Выделение среди конкурентов",
          priority,
        };

      default:
        return null;
    }
  }

  /**
   * Формирует summary анализа
   */
  private buildSummary(
    analysis: VacancyAnalytics,
    vacancy: VacancyData,
    question?: string,
  ): string {
    const parts: string[] = [];

    // Заголовок
    parts.push(`📊 **Анализ вакансии "${vacancy.title}"**`);
    parts.push("");

    // Ответ на вопрос, если задан
    if (question?.toLowerCase().includes("мало откликов")) {
      const mainIssue = analysis.issues[0];
      if (mainIssue) {
        parts.push(
          `**Основная причина:** ${mainIssue.title} — ${mainIssue.description}`,
        );
        parts.push("");
      }
    }

    // Метрики
    parts.push("**Метрики:**");
    parts.push(`• Всего откликов: ${analysis.metrics.totalResponses}`);
    parts.push(`• Обработано: ${analysis.metrics.processedResponses}`);
    parts.push(`• Высокий скоринг: ${analysis.metrics.highScoreResponses}`);
    parts.push(`• Средний скоринг: ${analysis.metrics.avgScore}`);
    parts.push(`• Конверсия: ${analysis.metrics.conversionRate}%`);
    parts.push("");

    // Проблемы
    if (analysis.issues.length > 0) {
      parts.push("**Выявленные проблемы:**");
      for (const issue of analysis.issues.slice(0, 3)) {
        const emoji =
          issue.severity === "high"
            ? "🔴"
            : issue.severity === "medium"
              ? "🟡"
              : "🟢";
        parts.push(`${emoji} ${issue.title}`);
      }
      parts.push("");
    }

    // Рекомендации
    if (analysis.recommendations.length > 0) {
      parts.push("**Рекомендации:**");
      for (const rec of analysis.recommendations.slice(0, 3)) {
        parts.push(`${rec.priority}. ${rec.title}`);
      }
    }

    return parts.join("\n");
  }

  /**
   * Формирует список suggestions
   */
  private buildSuggestions(recommendations: VacancyRecommendation[]): string[] {
    return recommendations.map((rec) => rec.description);
  }

  /**
   * Выполняет полный анализ вакансии с автоматическим получением рыночных данных
   * Использует MarketAnalyticsService для сравнения с рынком
   */
  async analyzeWithMarketData(
    input: VacancyAnalyticsInput,
    context: RecruiterAgentContext,
    vacancyData: VacancyData,
    metricsData: VacancyMetricsData,
  ): Promise<{
    success: boolean;
    data?: VacancyAnalyticsOutput;
    error?: string;
  }> {
    try {
      // Получаем рыночные данные через MarketAnalyticsService
      const marketService = getMarketAnalyticsService();
      const marketData = await marketService.getMarketData({
        position: vacancyData.title,
        location: undefined, // TODO: получать из vacancyData
        remote: undefined,
      });

      // Используем существующий метод с полученными рыночными данными
      return this.analyzeWithData(input, context, vacancyData, metricsData, {
        avgSalary: marketData.avgSalary,
        medianSalary: marketData.medianSalary,
        competitorVacancies: marketData.competitorVacancies,
        avgResponseRate: marketData.avgResponseRate,
      });
    } catch (error) {
      // Если не удалось получить рыночные данные, анализируем без них
      console.warn(
        "[VacancyAnalyticsAgent] Failed to fetch market data:",
        error,
      );
      return this.analyzeWithData(
        input,
        context,
        vacancyData,
        metricsData,
        undefined,
      );
    }
  }
}
