/**
 * ComparisonAgent - AI агент для сравнения кандидатов между собой
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../../core/base-agent";
import { AgentType } from "../../core/types";
import { COMPARISON_AGENT_SYSTEM_PROMPT } from "./prompts";

/**
 * Данные одного кандидата для сравнения
 */
export const candidateForComparisonSchema = z.object({
  id: z.string(),
  candidateName: z.string().nullable().optional(),

  // Все оценки
  priceScore: z.number().int().min(0).max(100).nullable().optional(),
  deliveryScore: z.number().int().min(0).max(100).nullable().optional(),
  skillsMatchScore: z.number().int().min(0).max(100).nullable().optional(),
  experienceScore: z.number().int().min(0).max(100).nullable().optional(),
  screeningScore: z.number().int().min(0).max(100).nullable().optional(),
  interviewScore: z.number().int().min(0).max(100).nullable().optional(),
  compositeScore: z.number().int().min(0).max(100),

  // Дополнительные данные для контекста
  proposedPrice: z.number().int().nullable().optional(),
  proposedDeliveryDays: z.number().int().nullable().optional(),
  skills: z.array(z.string()).nullable().optional(),
  experience: z.string().nullable().optional(),
});

export type CandidateForComparison = z.infer<
  typeof candidateForComparisonSchema
>;

/**
 * Входные данные для сравнения кандидатов
 */
export const comparisonAgentInputSchema = z.object({
  // Все кандидаты с их оценками
  candidates: z.array(candidateForComparisonSchema).min(1),

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

    deadline: z.date().nullable().optional(),
  }),
});

export type ComparisonAgentInput = z.infer<typeof comparisonAgentInputSchema>;

/**
 * Результат сравнения для одного кандидата
 */
const candidateComparisonResultSchema = z.object({
  candidateId: z.string(),
  strengths: z.array(z.string()).max(3),
  weaknesses: z.array(z.string()).max(3),
  comparative_analysis: z.string(),
});

/**
 * Выходные данные сравнения кандидатов
 */
export const comparisonAgentOutputSchema = z.object({
  comparisons: z.array(candidateComparisonResultSchema),
  category_leaders: z.object({
    best_price: z.string().optional(),
    fastest_delivery: z.string().optional(),
    strongest_skills: z.string().optional(),
    most_experienced: z.string().optional(),
    highest_screening: z.string().optional(),
    best_interview: z.string().optional(),
    highest_composite: z.string().optional(),
  }),
});

export type ComparisonAgentOutput = z.infer<typeof comparisonAgentOutputSchema>;

/**
 * Агент для сравнительного анализа кандидатов
 */
export class ComparisonAgent extends BaseAgent<
  ComparisonAgentInput,
  ComparisonAgentOutput
> {
  constructor(config: AgentConfig) {
    super(
      "ComparisonAgent",
      AgentType.EVALUATOR,
      COMPARISON_AGENT_SYSTEM_PROMPT,
      comparisonAgentOutputSchema,
      config,
    );
  }

  protected validate(input: ComparisonAgentInput): boolean {
    // Проверяем наличие минимально необходимых данных
    return (
      !!input.candidates &&
      input.candidates.length > 0 &&
      !!input.gigRequirements &&
      !!input.gigRequirements.title
    );
  }

  protected buildPrompt(
    input: ComparisonAgentInput,
    _context: unknown,
  ): string {
    const { candidates, gigRequirements, gigBudget } = input;

    // Форматируем информацию о задании
    const gigInfo = this.formatGigInfo(gigRequirements, gigBudget);

    // Форматируем данные всех кандидатов
    const candidatesInfo = this.formatCandidatesInfo(candidates);

    // Идентифицируем лидеров по категориям
    const leadersInfo = this.identifyCategoryLeaders(candidates);

    return `ЗАДАНИЕ: ${gigRequirements.title}

${gigInfo}

КАНДИДАТЫ (всего ${candidates.length}):

${candidatesInfo}

ЛИДЕРЫ ПО КАТЕГОРИЯМ:
${leadersInfo}

ЗАДАЧА:
Проведи сравнительный анализ всех кандидатов. Для каждого кандидата определи:

1. STRENGTHS (до 3 ключевых преимуществ):
   - Лидерство в категориях
   - Уникальные преимущества
   - Выдающиеся качества

2. WEAKNESSES (до 3 ключевых недостатков):
   - Отставание в категориях
   - Критичные пробелы
   - Факторы риска

3. COMPARATIVE_ANALYSIS (3-4 предложения):
   - Позиция в общем рейтинге
   - Сравнение с другими
   - Что выделяет или проблематично

Также определи category_leaders - ID лучших кандидатов по каждой категории.

ВАЖНО:
- Будь конкретным: используй числа и факты
- Учитывай контекст задания
- Фокусируйся на значимых различиях
- Если кандидат один, оценивай по абсолютным критериям`;
  }

  private formatGigInfo(
    requirements: ComparisonAgentInput["gigRequirements"],
    budget: ComparisonAgentInput["gigBudget"],
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
          `Бюджет: ${budget.budgetMin}-${budget.budgetMax} RUB`,
        );
      } else {
        parts.push(`Бюджет от: ${budget.budgetMin} RUB`);
      }
    } else if (budget.budgetMax !== null && budget.budgetMax !== undefined) {
      parts.push(`Бюджет до: ${budget.budgetMax} RUB`);
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

  private formatCandidatesInfo(candidates: CandidateForComparison[]): string {
    return candidates
      .map((candidate, index) => {
        const parts: string[] = [];
        parts.push(`\n--- Кандидат ${index + 1} (ID: ${candidate.id}) ---`);

        if (candidate.candidateName) {
          parts.push(`Имя: ${candidate.candidateName}`);
        }

        // Composite score
        parts.push(`Composite Score: ${candidate.compositeScore}/100`);

        // Отдельные оценки
        const scores: string[] = [];
        if (
          candidate.priceScore !== null &&
          candidate.priceScore !== undefined
        ) {
          scores.push(`Price: ${candidate.priceScore}`);
        }
        if (
          candidate.deliveryScore !== null &&
          candidate.deliveryScore !== undefined
        ) {
          scores.push(`Delivery: ${candidate.deliveryScore}`);
        }
        if (
          candidate.skillsMatchScore !== null &&
          candidate.skillsMatchScore !== undefined
        ) {
          scores.push(`Skills: ${candidate.skillsMatchScore}`);
        }
        if (
          candidate.experienceScore !== null &&
          candidate.experienceScore !== undefined
        ) {
          scores.push(`Experience: ${candidate.experienceScore}`);
        }
        if (
          candidate.screeningScore !== null &&
          candidate.screeningScore !== undefined
        ) {
          scores.push(`Screening: ${candidate.screeningScore}`);
        }
        if (
          candidate.interviewScore !== null &&
          candidate.interviewScore !== undefined
        ) {
          scores.push(`Interview: ${candidate.interviewScore}`);
        }

        if (scores.length > 0) {
          parts.push(`Оценки: ${scores.join(", ")}`);
        }

        // Дополнительные данные
        if (
          candidate.proposedPrice !== null &&
          candidate.proposedPrice !== undefined
        ) {
          parts.push(`Цена: ${candidate.proposedPrice}`);
        }
        if (
          candidate.proposedDeliveryDays !== null &&
          candidate.proposedDeliveryDays !== undefined
        ) {
          parts.push(`Сроки: ${candidate.proposedDeliveryDays} дней`);
        }
        if (candidate.skills && candidate.skills.length > 0) {
          parts.push(`Навыки: ${candidate.skills.join(", ")}`);
        }
        if (candidate.experience) {
          parts.push(
            `Опыт: ${candidate.experience.substring(0, 200)}${candidate.experience.length > 200 ? "..." : ""}`,
          );
        }

        return parts.join("\n");
      })
      .join("\n");
  }

  private identifyCategoryLeaders(
    candidates: CandidateForComparison[],
  ): string {
    const leaders: string[] = [];

    // Лучшая цена (самый высокий priceScore)
    const bestPrice = this.findBestCandidate(candidates, "priceScore");
    if (bestPrice) {
      leaders.push(
        `Лучшая цена: Кандидат ${bestPrice.id} (${bestPrice.priceScore}/100)`,
      );
    }

    // Самые быстрые сроки (самый высокий deliveryScore)
    const fastestDelivery = this.findBestCandidate(candidates, "deliveryScore");
    if (fastestDelivery) {
      leaders.push(
        `Самые быстрые сроки: Кандидат ${fastestDelivery.id} (${fastestDelivery.deliveryScore}/100)`,
      );
    }

    // Лучшее соответствие навыков
    const strongestSkills = this.findBestCandidate(
      candidates,
      "skillsMatchScore",
    );
    if (strongestSkills) {
      leaders.push(
        `Лучшие навыки: Кандидат ${strongestSkills.id} (${strongestSkills.skillsMatchScore}/100)`,
      );
    }

    // Самый опытный
    const mostExperienced = this.findBestCandidate(
      candidates,
      "experienceScore",
    );
    if (mostExperienced) {
      leaders.push(
        `Самый опытный: Кандидат ${mostExperienced.id} (${mostExperienced.experienceScore}/100)`,
      );
    }

    // Лучший screening
    const highestScreening = this.findBestCandidate(
      candidates,
      "screeningScore",
    );
    if (highestScreening) {
      leaders.push(
        `Лучший screening: Кандидат ${highestScreening.id} (${highestScreening.screeningScore}/100)`,
      );
    }

    // Лучшее интервью
    const bestInterview = this.findBestCandidate(candidates, "interviewScore");
    if (bestInterview) {
      leaders.push(
        `Лучшее интервью: Кандидат ${bestInterview.id} (${bestInterview.interviewScore}/100)`,
      );
    }

    // Лучший общий балл
    const highestComposite = this.findBestCandidate(
      candidates,
      "compositeScore",
    );
    if (highestComposite) {
      leaders.push(
        `Лучший общий балл: Кандидат ${highestComposite.id} (${highestComposite.compositeScore}/100)`,
      );
    }

    return leaders.length > 0 ? leaders.join("\n") : "Нет данных для сравнения";
  }

  private findBestCandidate(
    candidates: CandidateForComparison[],
    scoreField: keyof CandidateForComparison,
  ): CandidateForComparison | null {
    const candidatesWithScore = candidates.filter(
      (c) =>
        c[scoreField] !== null &&
        c[scoreField] !== undefined &&
        typeof c[scoreField] === "number",
    );

    if (candidatesWithScore.length === 0) {
      return null;
    }

    return candidatesWithScore.reduce((best, current) => {
      const bestScore = best[scoreField] as number;
      const currentScore = current[scoreField] as number;
      return currentScore > bestScore ? current : best;
    });
  }
}
