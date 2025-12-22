/**
 * Агент для финальной оценки интервью
 * Анализирует все вопросы и ответы, выставляет оценку
 * 
 * Использует InterviewContentFilterAgent для предварительной классификации ответов,
 * чтобы отличить содержательные ответы от приветствий и подтверждений.
 */

import { z } from "zod";
import { extractFirstName } from "../utils/name-extractor";
import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { InterviewContentFilterAgent } from "./interview-content-filter";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface InterviewScoringInput {
  previousQA: Array<{ question: string; answer: string }>;
}

const interviewScoringOutputSchema = z.object({
  score: z.number().int().min(0).max(5),
  detailedScore: z.number().int().min(0).max(100),
  analysis: z.string(),
  confidence: z.number().min(0).max(1),
});

export type InterviewScoringOutput = z.infer<
  typeof interviewScoringOutputSchema
>;

export class InterviewScoringAgent extends AIPoweredAgent<
  InterviewScoringInput,
  InterviewScoringOutput
> {
  private contentFilter: InterviewContentFilterAgent;

  constructor(config: AIPoweredAgentConfig) {
    super(
      "InterviewScoring",
      AgentType.EVALUATOR,
      "Ты — опытный рекрутер. Проанализируй интервью с кандидатом и дай оценку.",
      config,
    );
    this.contentFilter = new InterviewContentFilterAgent(config);
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

    const name = extractFirstName(candidateName || null);

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

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА ОЦЕНКИ:
1. ⚠️ НЕ БЛОКИРУЙ кандидатов за вежливые приветствия ("Привет", "Здравствуйте", "Hello", "Hi" и т.д.) - это нормальное начало диалога
2. ⚠️ Если кандидат дал ТОЛЬКО приветствие или очень короткие ответы БЕЗ содержательной информации о себе, опыте или ожиданиях - поставь НЕЙТРАЛЬНУЮ оценку:
   - score: 3 (из 5)
   - detailedScore: 50-60 (из 100)
   - В анализе укажи: "Недостаточно информации для полноценной оценки. Кандидат пока дал только приветствие/короткие ответы."
3. ⚠️ Низкие оценки (0-2, detailedScore < 40) ставь ТОЛЬКО если кандидат:
   - Демонстрирует грубость или неуважение
   - Явно не соответствует вакансии ПОСЛЕ содержательных ответов
   - Отказывается отвечать на вопросы
   - Показывает полное отсутствие мотивации ПОСЛЕ содержательного диалога
4. Оценивай по содержательным ответам, игнорируя формальные приветствия в начале

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "score": целое число от 0 до 5 (где 0 - совсем не подходит, 5 - отлично подходит),
  "detailedScore": целое число от 0 до 100,
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
      // ШАГ 1: Фильтрация содержательных ответов через отдельный агент
      const filterResult = await this.contentFilter.execute(
        { questionAnswers: input.previousQA },
        context,
      );

      let contentAnalysis = "";
      if (filterResult.success && filterResult.data) {
        const { substantiveCount, hasEnoughContent, summary } = filterResult.data;
        contentAnalysis = `\n\nАНАЛИЗ СОДЕРЖАТЕЛЬНОСТИ ОТВЕТОВ:\n${summary}\nСодержательных ответов: ${substantiveCount}\nДостаточно контента для оценки: ${hasEnoughContent ? "Да" : "Нет"}`;
        
        // Если нет содержательных ответов, сразу возвращаем нейтральную оценку
        if (!hasEnoughContent) {
          return {
            success: true,
            data: {
              score: 3,
              detailedScore: 55,
              analysis: "<p>Недостаточно информации для полноценной оценки кандидата.</p><p>Кандидат пока дал только <strong>приветствие или короткие подтверждения</strong> без содержательных ответов об опыте, навыках или ожиданиях.</p><p>Рекомендуется продолжить диалог для получения более детальной информации.</p>",
              confidence: 0.5,
            },
            metadata: {
              contentFilter: filterResult.data,
              earlyReturn: true,
            },
          };
        }
      }

      // ШАГ 2: Полноценная оценка через AI
      const prompt = this.buildPrompt(input, context) + contentAnalysis;
      const aiResponse = await this.generateAIResponse(prompt);

      const expectedFormat = `{
  "score": number (0-5),
  "detailedScore": number (0-100),
  "analysis": "string (HTML format)",
  "confidence": number (0.0-1.0)
}`;

      const parsed = await this.parseJSONResponseWithRetry(
        aiResponse,
        interviewScoringOutputSchema,
        expectedFormat,
      );

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      // Валидация диапазонов и округление до целых чисел
      if (parsed.score < 0 || parsed.score > 5) {
        parsed.score = Math.max(0, Math.min(5, Math.round(parsed.score)));
      } else {
        parsed.score = Math.round(parsed.score);
      }

      if (parsed.detailedScore < 0 || parsed.detailedScore > 100) {
        parsed.detailedScore = Math.max(
          0,
          Math.min(100, Math.round(parsed.detailedScore)),
        );
      } else {
        parsed.detailedScore = Math.round(parsed.detailedScore);
      }

      if (parsed.confidence < 0 || parsed.confidence > 1) {
        parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));
      }

      return { 
        success: true, 
        data: parsed, 
        metadata: { 
          prompt,
          contentFilter: filterResult.data,
        } 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
