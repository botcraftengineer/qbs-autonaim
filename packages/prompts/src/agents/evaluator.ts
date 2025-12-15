/**
 * Агент для оценки ответов кандидата
 */

import { BaseAgent } from "./base-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface EvaluatorInput {
  question: string;
  answer: string;
  allQA: Array<{ question: string; answer: string }>;
}

export interface EvaluatorOutput {
  score: number; // 0-5
  detailedScore: number; // 0-100
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: "CONTINUE" | "COMPLETE" | "NEED_MORE_INFO";
}

export class EvaluatorAgent extends BaseAgent<EvaluatorInput, EvaluatorOutput> {
  constructor() {
    super(
      "Evaluator",
      AgentType.EVALUATOR,
      `Ты — эксперт по оценке кандидатов на основе интервью.`,
    );
  }

  protected validate(input: EvaluatorInput): boolean {
    return !!input.question && !!input.answer;
  }

  protected buildPrompt(
    input: EvaluatorInput,
    context: BaseAgentContext,
  ): string {
    const qaHistory = input.allQA
      .map((qa, i) => `${i + 1}. В: ${qa.question}\n   О: ${qa.answer}`)
      .join("\n\n");

    return `${this.systemPrompt}

КОНТЕКСТ:
Вакансия: ${context.vacancyTitle || "не указана"}
${context.vacancyRequirements ? `Требования: ${context.vacancyRequirements}` : ""}

${qaHistory ? `ПРЕДЫДУЩИЕ ВОПРОСЫ И ОТВЕТЫ:\n${qaHistory}\n` : ""}

ТЕКУЩИЙ ВОПРОС:
${input.question}

ОТВЕТ КАНДИДАТА:
${input.answer}

ЗАДАЧА:
Оцени ответ кандидата по критериям:
- Полнота и конкретность ответа
- Релевантность опыта
- Коммуникативные навыки
- Мотивация
- Соответствие требованиям вакансии

ФОРМАТ ОТВЕТА (JSON):
{
  "score": 0-5,
  "detailedScore": 0-100,
  "analysis": "анализ в формате HTML с тегами <p>, <strong>, <ul>, <li>",
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "weaknesses": ["слабая сторона 1"],
  "recommendation": "CONTINUE" | "COMPLETE" | "NEED_MORE_INFO"
}`;
  }

  async execute(
    input: EvaluatorInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EvaluatorOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Базовая оценка без AI - средний балл
      // Для детального AI-анализа используйте EnhancedEvaluatorAgent
      return {
        success: true,
        data: {
          score: 3,
          detailedScore: 60,
          analysis:
            "<p>Базовая оценка. Для детального анализа используйте AI.</p>",
          strengths: ["Ответ получен"],
          weaknesses: ["Требуется детальный анализ"],
          recommendation: "CONTINUE",
        },
        metadata: { prompt },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
