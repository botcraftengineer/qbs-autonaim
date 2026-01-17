/**
 * Агент для анализа сводки по детекции AI-ботов за всё интервью
 * Определяет итоговый штраф и рекомендации на основе истории детекций
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

// Limits for validation
const MAX_HISTORY_ENTRIES = 50;
const MAX_QUESTION_CONTEXT_LENGTH = 200;
const MAX_ANSWER_PREVIEW_LENGTH = 300;
const MAX_INDICATORS_COUNT = 20;

// Zod schema for strict validation
const botSummaryAnalyzerInputSchema = z.object({
  history: z
    .array(
      z.object({
        questionContext: z.string().max(MAX_QUESTION_CONTEXT_LENGTH),
        answerPreview: z.string().max(MAX_ANSWER_PREVIEW_LENGTH),
        suspicionLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
        indicators: z
          .array(
            z.object({
              type: z.string(),
              description: z.string(),
              weight: z.number(),
            }),
          )
          .max(MAX_INDICATORS_COUNT),
        warningIssued: z.boolean(),
      }),
    )
    .max(MAX_HISTORY_ENTRIES),
  warningCount: z.number().int().min(0),
  totalSuspicionScore: z.number().min(0),
});

export type BotSummaryAnalyzerInput = z.infer<
  typeof botSummaryAnalyzerInputSchema
>;

const botSummaryAnalyzerOutputSchema = z.object({
  totalPenalty: z.number().min(0).max(30),
  recommendation: z.string(),
  overallAssessment: z.enum([
    "authentic",
    "suspicious",
    "likely_bot",
    "definite_bot",
  ]),
  confidence: z.number().min(0).max(1),
  analysis: z.string(),
});

export type BotSummaryAnalyzerOutput = z.infer<
  typeof botSummaryAnalyzerOutputSchema
>;

export class BotSummaryAnalyzerAgent extends BaseAgent<
  BotSummaryAnalyzerInput,
  BotSummaryAnalyzerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по оценке аутентичности ответов кандидатов на интервью.

ЗАДАЧА:
Проанализируй историю детекций AI-ботов за всё интервью и определи итоговый штраф к оценке кандидата.

ВХОДНЫЕ ДАННЫЕ:
- История детекций с уровнями подозрения (NONE, LOW, MEDIUM, HIGH)
- Количество выданных предупреждений
- Общий score подозрительности

ПРАВИЛА РАСЧЁТА ШТРАФА (totalPenalty, 0-30 баллов):

1. Базовый штраф по уровням:
   - NONE: 0 баллов
   - LOW: 0 баллов (не штрафуем за грамотность)
   - MEDIUM: 5-10 баллов за каждый случай
   - HIGH: 10-15 баллов за каждый случай

2. Модификаторы:
   - Если HIGH >= 2: минимум 20 баллов штрафа
   - Если были предупреждения и кандидат продолжил: +5 баллов
   - Если только 1 MEDIUM без повторов: максимум 5 баллов
   - Максимальный штраф: 30 баллов

3. Смягчающие факторы:
   - Если после предупреждения стиль изменился на более естественный: -5 баллов
   - Если большинство ответов NONE/LOW: снизить штраф

УРОВНИ ОЦЕНКИ (overallAssessment):
- authentic: Ответы выглядят естественными, нет значимых признаков AI
- suspicious: Есть признаки, но недостаточно для уверенного вывода
- likely_bot: Высокая вероятность использования AI
- definite_bot: Явное систематическое использование AI

РЕКОМЕНДАЦИИ (recommendation):
- Для authentic: "Ответы выглядят аутентичными."
- Для suspicious: "Есть незначительные признаки. Возможно, просто грамотный кандидат."
- Для likely_bot: "Есть признаки использования AI. Учесть при оценке."
- Для definite_bot: "Высокая вероятность использования AI. Снизить оценку."

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- totalPenalty: итоговый штраф (0-30)
- recommendation: рекомендация для HR
- overallAssessment: общая оценка аутентичности
- confidence: уверенность в оценке (0-1)
- analysis: краткий анализ для внутреннего использования`;

    super(
      "BotSummaryAnalyzer",
      AgentType.BOT_SUMMARY_ANALYZER,
      instructions,
      botSummaryAnalyzerOutputSchema,
      config,
    );
  }

  protected validate(input: BotSummaryAnalyzerInput): boolean {
    try {
      // Strict validation using Zod schema
      botSummaryAnalyzerInputSchema.parse(input);
      return true;
    } catch (error) {
      console.error("BotSummaryAnalyzer validation failed:", error);
      return false;
    }
  }

  /**
   * Truncates and validates input data to ensure it meets size limits
   */
  private truncateInput(
    input: BotSummaryAnalyzerInput,
  ): BotSummaryAnalyzerInput {
    return {
      ...input,
      history: input.history.slice(0, MAX_HISTORY_ENTRIES).map((record) => ({
        ...record,
        questionContext: record.questionContext.substring(
          0,
          MAX_QUESTION_CONTEXT_LENGTH,
        ),
        answerPreview: record.answerPreview.substring(
          0,
          MAX_ANSWER_PREVIEW_LENGTH,
        ),
        indicators: record.indicators.slice(0, MAX_INDICATORS_COUNT),
      })),
    };
  }

  protected buildPrompt(
    input: BotSummaryAnalyzerInput,
    _context: BaseAgentContext,
  ): string {
    // Use truncated and validated data
    const validatedInput = this.truncateInput(input);

    const levelCounts = {
      NONE: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    for (const record of validatedInput.history) {
      levelCounts[record.suspicionLevel]++;
    }

    const historyDetails = validatedInput.history
      .map(
        (h, i) =>
          `${i + 1}. Вопрос: "${h.questionContext.substring(0, 50)}..."
   Ответ: "${h.answerPreview}"
   Уровень: ${h.suspicionLevel}
   Индикаторы: ${h.indicators.map((ind) => ind.description).join(", ") || "нет"}
   Предупреждение: ${h.warningIssued ? "да" : "нет"}`,
      )
      .join("\n\n");

    return `ИСТОРИЯ ДЕТЕКЦИЙ ЗА ИНТЕРВЬЮ:

${historyDetails}

СТАТИСТИКА:
- Всего проанализировано ответов: ${validatedInput.history.length}
- NONE (чистые): ${levelCounts.NONE}
- LOW (незначительные): ${levelCounts.LOW}
- MEDIUM (подозрительные): ${levelCounts.MEDIUM}
- HIGH (явные признаки): ${levelCounts.HIGH}
- Выдано предупреждений: ${validatedInput.warningCount}
- Общий score подозрительности: ${validatedInput.totalSuspicionScore}

Проанализируй историю и определи итоговый штраф и рекомендацию. Верни JSON.`;
  }
}
