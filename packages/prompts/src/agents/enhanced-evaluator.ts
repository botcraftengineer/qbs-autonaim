/**
 * Улучшенный агент оценки с AI SDK
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface EnhancedEvaluatorInput {
  question: string;
  answer: string;
  allQA: Array<{ question: string; answer: string }>;
}

export interface EnhancedEvaluatorOutput {
  score: number; // 0-5
  detailedScore: number; // 0-100
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: "CONTINUE" | "COMPLETE" | "NEED_MORE_INFO";
}

export class EnhancedEvaluatorAgent extends AIPoweredAgent<
  EnhancedEvaluatorInput,
  EnhancedEvaluatorOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedEvaluator",
      AgentType.EVALUATOR,
      "Ты — эксперт по оценке кандидатов на основе интервью.",
      config,
    );
  }

  protected validate(input: EnhancedEvaluatorInput): boolean {
    return !!input.question && !!input.answer;
  }

  protected buildPrompt(
    input: EnhancedEvaluatorInput,
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
    input: EnhancedEvaluatorInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EnhancedEvaluatorOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Реальный AI-вызов
      const aiResponse = await this.generateAIResponse(prompt);
      const parsed =
        this.parseJSONResponse<EnhancedEvaluatorOutput>(aiResponse);

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      return { success: true, data: parsed, metadata: { prompt } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
