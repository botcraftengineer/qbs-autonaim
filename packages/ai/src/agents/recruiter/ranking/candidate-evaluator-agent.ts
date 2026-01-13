/**
 * CandidateEvaluatorAgent - AI агент для оценки кандидата по всем критериям
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import { CANDIDATE_EVALUATOR_SYSTEM_PROMPT } from "./prompts";

/**
 * Входные данные для оценки кандидата
 */
export const candidateEvaluatorInputSchema = z.object({
  // Данные кандидата
  candidate: z.object({
    id: z.string(),
    candidateName: z.string().nullable().optional(),
    proposedPrice: z.number().int().nullable().optional(),

    proposedDeliveryDays: z.number().int().nullable().optional(),
    coverLetter: z.string().nullable().optional(),
    experience: z.string().nullable().optional(),
    skills: z.array(z.string()).nullable().optional(),
    portfolioLinks: z.array(z.string()).nullable().optional(),
    rating: z.string().nullable().optional(),
  }),

  // Требования задания
  gigRequirements: z.object({
    title: z.string(),
    summary: z.string().optional(),
    required_skills: z.array(z.string()),
    nice_to_have_skills: z.array(z.string()).optional().default([]),
    tech_stack: z.array(z.string()).optional().default([]),
    experience_level: z.string().optional(),
  }),

  // Бюджет и сроки задания
  gigBudget: z.object({
    budgetMin: z.number().int().nullable().optional(),
    budgetMax: z.number().int().nullable().optional(),

    deadline: z.date().nullable().optional(),
  }),

  // Существующие оценки (если есть)
  existingScores: z
    .object({
      screeningScore: z.number().int().min(0).max(100).nullable().optional(),
      interviewScore: z.number().int().min(0).max(100).nullable().optional(),
    })
    .optional(),

  // Контекст рынка (цены других кандидатов для сравнения)
  marketContext: z
    .object({
      allPrices: z.array(z.number().int()).optional().default([]),
      allDeliveryDays: z.array(z.number().int()).optional().default([]),
    })
    .optional(),
});

export type CandidateEvaluatorInput = z.infer<
  typeof candidateEvaluatorInputSchema
>;

/**
 * Оценка по одному критерию
 */
const scoreWithReasoningSchema = z.object({
  score: z.number().int().min(0).max(100).nullable(),
  reasoning: z.string(),
});

/**
 * Выходные данные оценки кандидата
 */
export const candidateEvaluatorOutputSchema = z.object({
  priceScore: scoreWithReasoningSchema,
  deliveryScore: scoreWithReasoningSchema,
  skillsMatchScore: scoreWithReasoningSchema,
  experienceScore: scoreWithReasoningSchema,
  compositeScore: scoreWithReasoningSchema,
});

export type CandidateEvaluatorOutput = z.infer<
  typeof candidateEvaluatorOutputSchema
>;

/**
 * Агент для комплексной оценки кандидата
 */
export class CandidateEvaluatorAgent extends BaseAgent<
  CandidateEvaluatorInput,
  CandidateEvaluatorOutput
> {
  constructor(config: AgentConfig) {
    super(
      "CandidateEvaluator",
      AgentType.EVALUATOR,
      CANDIDATE_EVALUATOR_SYSTEM_PROMPT,
      candidateEvaluatorOutputSchema,
      config,
    );
  }

  protected validate(input: CandidateEvaluatorInput): boolean {
    // Проверяем наличие минимально необходимых данных
    return (
      !!input.candidate &&
      !!input.candidate.id &&
      !!input.gigRequirements &&
      !!input.gigRequirements.title
    );
  }

  protected buildPrompt(
    input: CandidateEvaluatorInput,
    _context: unknown,
  ): string {
    const {
      candidate,
      gigRequirements,
      gigBudget,
      existingScores,
      marketContext,
    } = input;

    // Форматируем данные кандидата
    const candidateInfo = this.formatCandidateInfo(candidate);

    // Форматируем требования задания
    const requirementsInfo = this.formatRequirementsInfo(gigRequirements);

    // Форматируем бюджет и сроки
    const budgetInfo = this.formatBudgetInfo(gigBudget);

    // Форматируем существующие оценки
    const existingScoresInfo = this.formatExistingScores(existingScores);

    // Форматируем рыночный контекст
    const marketInfo = this.formatMarketContext(marketContext);

    return `ЗАДАНИЕ: ${gigRequirements.title}

${requirementsInfo}

${budgetInfo}

ДАННЫЕ КАНДИДАТА:
${candidateInfo}

${existingScoresInfo}

${marketInfo}

ЗАДАЧА:
Оцени этого кандидата по всем критериям (price, delivery, skills_match, experience, composite).
Для каждого критерия предоставь:
1. score: число 0-100 (или null если данных недостаточно)
2. reasoning: детальное объяснение оценки

Учитывай:
- Контекст задания и его требования
- Рыночные реалии и сравнение с другими кандидатами
- Баланс между ценой, качеством и сроками
- Существующие оценки (screening/interview) если они есть

Будь объективным, но учитывай нюансы и контекст.`;
  }

  private formatCandidateInfo(
    candidate: CandidateEvaluatorInput["candidate"],
  ): string {
    const parts: string[] = [];

    if (candidate.candidateName) {
      parts.push(`Имя: ${candidate.candidateName}`);
    }

    if (
      candidate.proposedPrice !== null &&
      candidate.proposedPrice !== undefined
    ) {
      parts.push(`Предложенная цена: ${candidate.proposedPrice} ₽`);
    } else {
      parts.push(`Предложенная цена: не указана`);
    }

    if (
      candidate.proposedDeliveryDays !== null &&
      candidate.proposedDeliveryDays !== undefined
    ) {
      parts.push(`Предложенные сроки: ${candidate.proposedDeliveryDays} дней`);
    } else {
      parts.push(`Предложенные сроки: не указаны`);
    }

    if (candidate.skills && candidate.skills.length > 0) {
      parts.push(`Навыки: ${candidate.skills.join(", ")}`);
    } else {
      parts.push(`Навыки: не указаны`);
    }

    if (candidate.experience) {
      parts.push(`Опыт: ${candidate.experience}`);
    } else {
      parts.push(`Опыт: не указан`);
    }

    if (candidate.coverLetter) {
      parts.push(`Cover Letter: ${candidate.coverLetter}`);
    }

    if (candidate.portfolioLinks && candidate.portfolioLinks.length > 0) {
      parts.push(`Портфолио: ${candidate.portfolioLinks.length} ссылок`);
    }

    if (candidate.rating) {
      parts.push(`Рейтинг: ${candidate.rating}`);
    }

    return parts.join("\n");
  }

  private formatRequirementsInfo(
    requirements: CandidateEvaluatorInput["gigRequirements"],
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

    if (requirements.tech_stack && requirements.tech_stack.length > 0) {
      parts.push(`Tech Stack: ${requirements.tech_stack.join(", ")}`);
    }

    if (requirements.experience_level) {
      parts.push(`Требуемый уровень: ${requirements.experience_level}`);
    }

    return `ТРЕБОВАНИЯ:\n${parts.join("\n")}`;
  }

  private formatBudgetInfo(
    budget: CandidateEvaluatorInput["gigBudget"],
  ): string {
    const parts: string[] = [];

    if (budget.budgetMin !== null && budget.budgetMin !== undefined) {
      if (budget.budgetMax !== null && budget.budgetMax !== undefined) {
        parts.push(`Бюджет: ${budget.budgetMin}-${budget.budgetMax} ₽`);
      } else {
        parts.push(`Бюджет от: ${budget.budgetMin} ₽`);
      }
    } else if (budget.budgetMax !== null && budget.budgetMax !== undefined) {
      parts.push(`Бюджет до: ${budget.budgetMax} ₽`);
    } else {
      parts.push(`Бюджет: не указан`);
    }

    if (budget.deadline) {
      const daysToDeadline = Math.ceil(
        (budget.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      parts.push(
        `Дедлайн: ${budget.deadline.toLocaleDateString()} (через ${daysToDeadline} дней)`,
      );
    } else {
      parts.push(`Дедлайн: не указан`);
    }

    return `БЮДЖЕТ И СРОКИ:\n${parts.join("\n")}`;
  }

  private formatExistingScores(
    scores: CandidateEvaluatorInput["existingScores"],
  ): string {
    if (!scores) {
      return "";
    }

    const parts: string[] = [];

    if (scores.screeningScore !== null && scores.screeningScore !== undefined) {
      parts.push(`Screening Score: ${scores.screeningScore}/100`);
    }

    if (scores.interviewScore !== null && scores.interviewScore !== undefined) {
      parts.push(`Interview Score: ${scores.interviewScore}/100`);
    }

    if (parts.length === 0) {
      return "";
    }

    return `СУЩЕСТВУЮЩИЕ ОЦЕНКИ:\n${parts.join("\n")}\n`;
  }

  private formatMarketContext(
    context: CandidateEvaluatorInput["marketContext"],
  ): string {
    if (!context) {
      return "";
    }

    const parts: string[] = [];

    if (context.allPrices && context.allPrices.length > 0) {
      const avgPrice = Math.round(
        context.allPrices.reduce((sum, p) => sum + p, 0) /
          context.allPrices.length,
      );
      const minPrice = Math.min(...context.allPrices);
      const maxPrice = Math.max(...context.allPrices);
      parts.push(
        `Цены других кандидатов: ${minPrice}-${maxPrice} (средняя: ${avgPrice})`,
      );
    }

    if (context.allDeliveryDays && context.allDeliveryDays.length > 0) {
      const avgDays = Math.round(
        context.allDeliveryDays.reduce((sum, d) => sum + d, 0) /
          context.allDeliveryDays.length,
      );
      const minDays = Math.min(...context.allDeliveryDays);
      const maxDays = Math.max(...context.allDeliveryDays);
      parts.push(
        `Сроки других кандидатов: ${minDays}-${maxDays} дней (средние: ${avgDays})`,
      );
    }

    if (parts.length === 0) {
      return "";
    }

    return `РЫНОЧНЫЙ КОНТЕКСТ:\n${parts.join("\n")}\n`;
  }
}
