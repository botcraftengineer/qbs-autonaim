/**
 * Агент для финальной оценки интервью
 * Анализирует все вопросы и ответы, выставляет оценку
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface InterviewScoringInput {
  previousQA: Array<{ question: string; answer: string }>;
}

export interface InterviewScoringOutput {
  score: number;
  detailedScore: number;
  analysis: string;
  confidence: number;
}

export class InterviewScoringAgent extends AIPoweredAgent<
  InterviewScoringInput,
  InterviewScoringOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "InterviewScoring",
      AgentType.EVALUATOR,
      "Ты — опытный рекрутер. Проанализируй интервью с кандидатом и дай оценку.",
      config,
    );
  }

  protected validate(input: InterviewScoringInput): boolean {
    if (!Array.isArray(input.previousQA)) return false;
    if (input.previousQA.length === 0) return false;

    return true;
  }

  protected buildPrompt(
    input: InterviewScoringInput,
    context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, vacancyDescription } = context;

    const name = candidateName?.split(" ")[0] || "Кандидат";

    return `${this.systemPrompt}

ИНФОРМАЦИЯ О ВАКАНСИИ:
Позиция: ${vacancyTitle || "Не указана"}
${vacancyDescription ? `Описание: ${vacancyDescription}` : ""}

КАНДИДАТ: ${name}

ИНТЕРВЬЮ (ВОПРОСЫ И ОТВЕТЫ):
${input.previousQA.map((qa, i) => `${i + 1}. Вопрос: ${qa.question}\n   Ответ: ${qa.answer}`).join("\n\n")}

ТВОЯ ЗАДАЧА:
Оцени кандидата по результатам интервью, учитывая:
- Мотивацию и заинтересованность
- Релевантность опыта
- Коммуникативные навыки
- Соответствие ожиданиям вакансии
- Общее впечатление

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "score": число от 0 до 5 (где 0 - совсем не подходит, 5 - отлично подходит),
  "detailedScore": число от 0 до 100,
  "analysis": "подробный анализ кандидата на основе интервью, 3-5 предложений в формате HTML. Используй теги: <p> для абзацев, <strong> для выделения ключевых моментов, <ul>/<li> для списков сильных/слабых сторон, <br> для переносов строк",
  "confidence": число от 0.0 до 1.0
}

Будь объективным и конструктивным в оценке.

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста до или после.`;
  }

  async execute(
    input: InterviewScoringInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<InterviewScoringOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      const aiResponse = await this.generateAIResponse(prompt);

      const expectedFormat = `{
  "score": number (0-5),
  "detailedScore": number (0-100),
  "analysis": "string (HTML format)",
  "confidence": number (0.0-1.0)
}`;

      const parsed = await this.parseJSONResponseWithRetry<InterviewScoringOutput>(
        aiResponse,
        expectedFormat,
      );

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      // Валидация диапазонов
      if (parsed.score < 0 || parsed.score > 5) {
        parsed.score = Math.max(0, Math.min(5, parsed.score));
      }

      if (parsed.detailedScore < 0 || parsed.detailedScore > 100) {
        parsed.detailedScore = Math.max(0, Math.min(100, parsed.detailedScore));
      }

      if (parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
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
