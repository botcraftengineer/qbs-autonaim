/**
 * Агент для фильтрации содержательных ответов в интервью
 * Классифицирует каждый ответ как содержательный или формальный (приветствие, подтверждение)
 */

import { z } from "zod";
import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface InterviewContentFilterInput {
  questionAnswers: Array<{ question: string; answer: string }>;
}

const answerClassificationSchema = z.object({
  index: z.number(),
  isSubstantive: z.boolean(),
  category: z.enum([
    "GREETING", // Приветствие
    "ACKNOWLEDGMENT", // Подтверждение (ок, спасибо)
    "SUBSTANTIVE", // Содержательный ответ
    "UNCLEAR", // Непонятный ответ
  ]),
  reason: z.string(),
});

const interviewContentFilterOutputSchema = z.object({
  classifications: z.array(answerClassificationSchema),
  substantiveCount: z.number(),
  hasEnoughContent: z.boolean(),
  summary: z.string(),
});

export type InterviewContentFilterOutput = z.infer<
  typeof interviewContentFilterOutputSchema
>;

export class InterviewContentFilterAgent extends AIPoweredAgent<
  InterviewContentFilterInput,
  InterviewContentFilterOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "InterviewContentFilter",
      AgentType.EVALUATOR,
      "Ты — эксперт по анализу коммуникаций. Твоя задача — классифицировать ответы кандидата на содержательные и формальные.",
      config,
    );
  }

  protected validate(input: InterviewContentFilterInput): boolean {
    return (
      Array.isArray(input.questionAnswers) && input.questionAnswers.length > 0
    );
  }

  protected buildPrompt(
    input: InterviewContentFilterInput,
    _context: BaseAgentContext,
  ): string {
    return `${this.systemPrompt}

ВОПРОСЫ И ОТВЕТЫ ИНТЕРВЬЮ:
${input.questionAnswers.map((qa, i) => `${i}. Вопрос: ${qa.question}\n   Ответ: ${qa.answer}`).join("\n\n")}

ТВОЯ ЗАДАЧА:
Классифицируй каждый ответ кандидата по категориям:

1. GREETING - Приветствие
   Примеры: "Привет", "Здравствуйте", "Добрый день", "Hello", "Hi"
   
2. ACKNOWLEDGMENT - Простое подтверждение без информации
   Примеры: "Ок", "Хорошо", "Понятно", "Спасибо", "Да", "Нет"
   
3. SUBSTANTIVE - Содержательный ответ с информацией
   Примеры: Рассказ об опыте, ответы на вопросы о навыках, зарплате, графике
   
4. UNCLEAR - Непонятный или нерелевантный ответ

ПРАВИЛА КЛАССИФИКАЦИИ:
- Ответ считается SUBSTANTIVE, если содержит хотя бы одну из:
  * Информацию об опыте работы
  * Ответ на конкретный вопрос интервью
  * Личные данные (имя, возраст, образование)
  * Ожидания (зарплата, график, условия)
  * Вопрос к работодателю
  
- Ответ НЕ считается SUBSTANTIVE, если это:
  * Только приветствие
  * Только подтверждение ("ок", "да", "понятно")
  * Эмодзи без текста
  * Очень короткая фраза без смысловой нагрузки

ФОРМАТ ОТВЕТА (JSON):
{
  "classifications": [
    {
      "index": 0,
      "isSubstantive": false,
      "category": "GREETING",
      "reason": "Простое приветствие в начале диалога"
    }
  ],
  "substantiveCount": число содержательных ответов,
  "hasEnoughContent": true если есть хотя бы 1 содержательный ответ,
  "summary": "Краткая сводка: сколько содержательных ответов, сколько формальных"
}

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста.`;
  }

  async execute(
    input: InterviewContentFilterInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<InterviewContentFilterOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);
      const aiResponse = await this.generateAIResponse(prompt);

      const expectedFormat = `{
  "classifications": [{"index": number, "isSubstantive": boolean, "category": "GREETING"|"ACKNOWLEDGMENT"|"SUBSTANTIVE"|"UNCLEAR", "reason": "string"}],
  "substantiveCount": number,
  "hasEnoughContent": boolean,
  "summary": "string"
}`;

      const parsed = await this.parseJSONResponseWithRetry(
        aiResponse,
        interviewContentFilterOutputSchema,
        expectedFormat,
      );

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
