/**
 * RecommendationAgent - AI агент для формирования финальной рекомендации
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import { RECOMMENDATION_AGENT_SYSTEM_PROMPT } from "./prompts";

/**
 * Enum для статусов рекомендаций
 */
export const recommendationStatusEnum = z.enum([
  "HIGHLY_RECOMMENDED",
  "RECOMMENDED",
  "NEUTRAL",
  "NOT_RECOMMENDED",
]);

export type RecommendationStatus = z.infer<typeof recommendationStatusEnum>;

/**
 * Входные данные для формирования рекомендации
 */
export const recommendationAgentInputSchema = z.object({
  // Данные кандидата
  candidate: z.object({
    id: z.string(),
    candidateName: z.string().nullable().optional(),
    proposedPrice: z.number().int().nullable().optional(),
    proposedCurrency: z.string().default("RUB"),
    proposedDeliveryDays: z.number().int().nullable().optional(),
    coverLetter: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    skills: z.array(z.string()).nullable().optional(),
  }),

  // Все оценки кандидата
  scores: z.object({
    priceScore: z.number().int().min(0).max(100).nullable().optional(),
    deliveryScore: z.number().int().min(0).max(100).nullable().optional(),
    skillsMatchScore: z.number().int().min(0).max(100).nullable().optional(),
    experienceScore: z.number().int().min(0).max(100).nullable().optional(),
    screeningScore: z.number().int().min(0).max(100).nullable().optional(),
    interviewScore: z.number().int().min(0).max(100).nullable().optional(),
    compositeScore: z.number().int().min(0).max(100),
  }),

  // Результаты сравнения
  comparison: z.object({
    strengths: z.array(z.string()).max(3),
    weaknesses: z.array(z.string()).max(3),
    comparative_analysis: z.string(),
  }),

  // Требования задания для контекста
  gigRequirements: z.object({
    title: z.string(),
    summary: z.string().optional(),
    required_skills: z.array(z.string()),
    nice_to_have_skills: z.array(z.string()).optional().default([]),
    experience_level: z.string().optional(),
  }),

  // Бюджет для контекста
  gigBudget: z.object({
    budgetMin: z.number().int().nullable().optional(),
    budgetMax: z.number().int().nullable().optional(),
    budgetCurrency: z.string().default("RUB"),
    deadline: z.date().nullable().optional(),
  }),

  // Контекст других кандидатов (опционально)
  competitionContext: z
    .object({
      totalCandidates: z.number().int(),
      averageCompositeScore: z.number().optional(),
      topCompositeScore: z.number().optional(),
    })
    .optional(),
});

export type RecommendationAgentInput = z.infer<
  typeof recommendationAgentInputSchema
>;

/**
 * Выходные данные рекомендации
 */
export const recommendationAgentOutputSchema = z.object({
  recommendation: recommendationStatusEnum,
  ranking_analysis: z.string(),
  actionable_insights: z.array(z.string()).min(1).max(2),
});

export type RecommendationAgentOutput = z.infer<
  typeof recommendationAgentOutputSchema
>;

/**
 * Агент для формирования финальной рекомендации по кандидату
 */
export class RecommendationAgent extends BaseAgent<
  RecommendationAgentInput,
  RecommendationAgentOutput
> {
  constructor(config: AgentConfig) {
    super(
      "RecommendationAgent",
      AgentType.EVALUATOR,
      RECOMMENDATION_AGENT_SYSTEM_PROMPT,
      recommendationAgentOutputSchema,
      config,
    );
  }

  protected validate(input: RecommendationAgentInput): boolean {
    // Проверяем наличие минимально необходимых данных
    return (
      !!input.candidate &&
      !!input.candidate.id &&
      !!input.scores &&
      typeof input.scores.compositeScore === "number" &&
      !!input.comparison &&
      !!input.gigRequirements &&
      !!input.gigRequirements.title
    );
  }

  protected buildPrompt(
    input: RecommendationAgentInput,
    _context: unknown,
  ): string {
    const {
      candidate,
      scores,
      comparison,
      gigRequirements,
      gigBudget,
      competitionContext,
    } = input;

    // Форматируем информацию о задании
    const gigInfo = this.formatGigInfo(gigRequirements, gigBudget);

    // Форматируем данные кандидата
    const candidateInfo = this.formatCandidateInfo(candidate);

    // Форматируем оценки
    const scoresInfo = this.formatScoresInfo(scores);

    // Форматируем результаты сравнения
    const comparisonInfo = this.formatComparisonInfo(comparison);

    // Форматируем контекст конкуренции
    const competitionInfo = this.formatCompetitionContext(competitionContext);

    // Определяем базовый статус на основе composite_score
    const baseStatus = this.determineBaseStatus(scores.compositeScore);

    return `ЗАДАНИЕ: ${gigRequirements.title}

${gigInfo}

КАНДИДАТ (ID: ${candidate.id}):
${candidateInfo}

ОЦЕНКИ:
${scoresInfo}

СРАВНИТЕЛЬНЫЙ АНАЛИЗ:
${comparisonInfo}

${competitionInfo}

БАЗОВЫЙ СТАТУС (на основе composite_score ${scores.compositeScore}/100): ${baseStatus}

ЗАДАЧА:
Сформируй финальную рекомендацию по этому кандидату. Определи:

1. RECOMMENDATION (статус):
   - Используй composite_score как primary signal
   - Можешь скорректировать на ±1 уровень на основе качественных факторов
   - Учитывай: коммуникацию, red flags, портфолио, культурный fit

2. RANKING_ANALYSIS (4-6 предложений):
   - Обоснование финальной рекомендации
   - Ключевые факторы решения (используй strengths/weaknesses)
   - Риски и возможности
   - Сравнение с другими кандидатами (если есть контекст)

3. ACTIONABLE_INSIGHTS (1-2 практических совета):
   - Конкретные действия для рекрутера
   - Примеры: "Verify availability", "Fast-track to interview", "Request portfolio samples"

ВАЖНО:
- Будь объективным и основывайся на данных
- Учитывай trade-offs между критериями
- Если данных мало, укажи это как ограничение
- Рекомендации должны быть практичными и действенными`;
  }

  private formatGigInfo(
    requirements: RecommendationAgentInput["gigRequirements"],
    budget: RecommendationAgentInput["gigBudget"],
  ): string {
    const parts: string[] = [];

    if (requirements.summary) {
      parts.push(`Описание: ${requirements.summary}`);
    }

    parts.push(`Required Skills: ${requirements.required_skills.join(", ")}`);

    if (
      requirements.nice_to_have_skills &&
      requirements.nice_to_have_skills.length > 0
    ) {
      parts.push(
        `Nice-to-Have Skills: ${requirements.nice_to_have_skills.join(", ")}`,
      );
    }

    if (requirements.experience_level) {
      parts.push(`Требуемый уровень: ${requirements.experience_level}`);
    }

    // Бюджет
    if (budget.budgetMin !== null && budget.budgetMin !== undefined) {
      if (budget.budgetMax !== null && budget.budgetMax !== undefined) {
        parts.push(
          `Бюджет: ${budget.budgetMin}-${budget.budgetMax} ${budget.budgetCurrency}`,
        );
      } else {
        parts.push(`Бюджет от: ${budget.budgetMin} ${budget.budgetCurrency}`);
      }
    } else if (budget.budgetMax !== null && budget.budgetMax !== undefined) {
      parts.push(`Бюджет до: ${budget.budgetMax} ${budget.budgetCurrency}`);
    }

    if (budget.deadline) {
      const daysToDeadline = Math.ceil(
        (budget.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      parts.push(
        `Дедлайн: ${budget.deadline.toLocaleDateString()} (через ${daysToDeadline} дней)`,
      );
    }

    return parts.join("\n");
  }

  private formatCandidateInfo(
    candidate: RecommendationAgentInput["candidate"],
  ): string {
    const parts: string[] = [];

    if (candidate.candidateName) {
      parts.push(`Имя: ${candidate.candidateName}`);
    }

    if (
      candidate.proposedPrice !== null &&
      candidate.proposedPrice !== undefined
    ) {
      parts.push(
        `Предложенная цена: ${candidate.proposedPrice} ${candidate.proposedCurrency}`,
      );
    }

    if (
      candidate.proposedDeliveryDays !== null &&
      candidate.proposedDeliveryDays !== undefined
    ) {
      parts.push(`Предложенные сроки: ${candidate.proposedDeliveryDays} дней`);
    }

    if (candidate.skills && candidate.skills.length > 0) {
      parts.push(`Навыки: ${candidate.skills.join(", ")}`);
    }

    if (candidate.experience) {
      const experiencePreview =
        candidate.experience.length > 300
          ? `${candidate.experience.substring(0, 300)}...`
          : candidate.experience;
      parts.push(`Опыт: ${experiencePreview}`);
    }

    if (candidate.coverLetter) {
      const coverLetterPreview =
        candidate.coverLetter.length > 200
          ? `${candidate.coverLetter.substring(0, 200)}...`
          : candidate.coverLetter;
      parts.push(`Cover Letter: ${coverLetterPreview}`);
    }

    return parts.join("\n");
  }

  private formatScoresInfo(scores: RecommendationAgentInput["scores"]): string {
    const parts: string[] = [];

    parts.push(`Composite Score: ${scores.compositeScore}/100`);

    const individualScores: string[] = [];

    if (scores.priceScore !== null && scores.priceScore !== undefined) {
      individualScores.push(`Price: ${scores.priceScore}/100`);
    }

    if (scores.deliveryScore !== null && scores.deliveryScore !== undefined) {
      individualScores.push(`Delivery: ${scores.deliveryScore}/100`);
    }

    if (
      scores.skillsMatchScore !== null &&
      scores.skillsMatchScore !== undefined
    ) {
      individualScores.push(`Skills Match: ${scores.skillsMatchScore}/100`);
    }

    if (
      scores.experienceScore !== null &&
      scores.experienceScore !== undefined
    ) {
      individualScores.push(`Experience: ${scores.experienceScore}/100`);
    }

    if (scores.screeningScore !== null && scores.screeningScore !== undefined) {
      individualScores.push(`Screening: ${scores.screeningScore}/100`);
    }

    if (scores.interviewScore !== null && scores.interviewScore !== undefined) {
      individualScores.push(`Interview: ${scores.interviewScore}/100`);
    }

    if (individualScores.length > 0) {
      parts.push(`Детализация: ${individualScores.join(", ")}`);
    }

    return parts.join("\n");
  }

  private formatComparisonInfo(
    comparison: RecommendationAgentInput["comparison"],
  ): string {
    const parts: string[] = [];

    if (comparison.strengths.length > 0) {
      parts.push(
        `Strengths:\n${comparison.strengths.map((s) => `  - ${s}`).join("\n")}`,
      );
    } else {
      parts.push("Strengths: не выявлено");
    }

    if (comparison.weaknesses.length > 0) {
      parts.push(
        `Weaknesses:\n${comparison.weaknesses.map((w) => `  - ${w}`).join("\n")}`,
      );
    } else {
      parts.push("Weaknesses: не выявлено");
    }

    parts.push(`\nСравнительный анализ:\n${comparison.comparative_analysis}`);

    return parts.join("\n");
  }

  private formatCompetitionContext(
    context: RecommendationAgentInput["competitionContext"],
  ): string {
    if (!context) {
      return "";
    }

    const parts: string[] = [];

    parts.push(`КОНТЕКСТ КОНКУРЕНЦИИ:`);
    parts.push(`Всего кандидатов: ${context.totalCandidates}`);

    if (context.averageCompositeScore !== undefined) {
      parts.push(
        `Средний composite score: ${context.averageCompositeScore.toFixed(1)}/100`,
      );
    }

    if (context.topCompositeScore !== undefined) {
      parts.push(
        `Лучший composite score: ${context.topCompositeScore.toFixed(1)}/100`,
      );
    }

    return `\n${parts.join("\n")}\n`;
  }

  private determineBaseStatus(compositeScore: number): string {
    if (compositeScore >= 80) {
      return "HIGHLY_RECOMMENDED";
    }
    if (compositeScore >= 60) {
      return "RECOMMENDED";
    }
    if (compositeScore >= 40) {
      return "NEUTRAL";
    }
    return "NOT_RECOMMENDED";
  }
}
