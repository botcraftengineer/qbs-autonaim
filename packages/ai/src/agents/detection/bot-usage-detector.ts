/**
 * Агент для детекции использования AI-ботов кандидатами
 * Анализирует ответы на признаки копирования из ChatGPT, Claude и т.д.
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface BotUsageDetectorInput {
  currentMessage: string;
  responseTimeMs: number;
  messageLength: number;
  questionContext?: string;
}

const botUsageDetectorInputSchema = z
  .object({
    currentMessage: z.string().min(1).max(2000),
    responseTimeMs: z.number().nonnegative(),
    messageLength: z.number().optional(),
    questionContext: z.string().max(1000).optional(),
  })
  .transform((data) => {
    // Compute actual message length from currentMessage
    const computedLength = data.currentMessage.length;

    // If messageLength was provided and doesn't match, ignore it and use computed
    return {
      currentMessage: data.currentMessage,
      responseTimeMs: data.responseTimeMs,
      messageLength: computedLength,
      questionContext: data.questionContext,
    };
  });

const botIndicatorSchema = z.object({
  type: z.enum(["structural", "lexical", "behavioral", "content"]),
  description: z.string(),
  weight: z.number().min(0).max(1),
});

const botUsageDetectorOutputSchema = z.object({
  suspicionLevel: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
  confidence: z.number().min(0).max(1),
  indicators: z.array(botIndicatorSchema),
  shouldWarn: z.boolean(),
  warningType: z.enum(["none", "soft", "direct", "strict", "final"]).optional(),
  scorePenalty: z.number().min(0).max(30),
  analysis: z.string(),
});

export type BotUsageDetectorOutput = z.infer<
  typeof botUsageDetectorOutputSchema
>;
export type BotIndicator = z.infer<typeof botIndicatorSchema>;

export class BotUsageDetectorAgent extends BaseAgent<
  BotUsageDetectorInput,
  BotUsageDetectorOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по выявлению AI-генерированного контента в ответах кандидатов на интервью.

ЗАДАЧА:
Проанализируй ответ кандидата на признаки использования AI-ассистентов (ChatGPT, Claude, Gemini и т.д.).

ПРИЗНАКИ AI-ГЕНЕРИРОВАННЫХ ОТВЕТОВ:

1. СТРУКТУРНЫЕ (type: "structural", базовый weight: 0.15-0.25):
   - Чрезмерная структурированность: списки, нумерация на простые вопросы
   - Идеальная грамматика и пунктуация без единой ошибки в длинном тексте
   - Перефразирование вопроса в начале ответа
   - Вводные фразы: "Конечно!", "Отличный вопрос!", "Рад ответить!", "Безусловно!"
   - Заключительные фразы: "Надеюсь, это помогло", "Если есть вопросы..."

2. ЛЕКСИЧЕСКИЕ (type: "lexical", базовый weight: 0.15-0.25):
   - Характерные слова: "безусловно", "несомненно", "в контексте", "ключевой аспект"
   - Фразы: "важно отметить", "стоит подчеркнуть", "следует учитывать", "необходимо упомянуть"
   - Избыточные связки: "во-первых...во-вторых...в-третьих", "с одной стороны...с другой"
   - Академический/формальный стиль в разговорном контексте
   - Отсутствие сленга, сокращений, разговорных оборотов в длинном тексте

3. ПОВЕДЕНЧЕСКИЕ (type: "behavioral", базовый weight: 0.2-0.35):
   - Резкое изменение стиля между сообщениями (был краткий → стал развёрнутый)
   - Подозрительное время ответа:
     * < 5 сек на развёрнутый ответ (> 300 символов) = очень подозрительно
     * 30-90 сек на простой вопрос = возможно копирует из AI
   - Отсутствие личных историй, только абстрактные примеры
   - Уклонение от конкретных деталей при уточняющих вопросах

4. КОНТЕНТНЫЕ (type: "content", базовый weight: 0.15-0.25):
   - Ответ звучит как статья из Википедии или учебника
   - Избыточная полнота — отвечает на то, о чём не спрашивали
   - Противоречия с ранее сказанным в диалоге
   - Слишком "идеальные" ответы без сомнений, оговорок, "не помню точно"
   - Использование устаревшей информации (признак cutoff date AI)

УРОВНИ ПОДОЗРЕНИЯ:
- NONE: Естественный человеческий ответ, нет индикаторов
- LOW: 1-2 слабых индикатора (суммарный weight < 0.3) — не предупреждать
- MEDIUM: 3+ индикаторов или суммарный weight 0.3-0.5 — мягкое предупреждение
- HIGH: Явные признаки, суммарный weight > 0.5 — строгое предупреждение

ШТРАФЫ К ИТОГОВОЙ ОЦЕНКЕ (scorePenalty):
- NONE: 0 баллов
- LOW: 0 баллов
- MEDIUM: 5-15 баллов (в зависимости от уверенности)
- HIGH: 15-30 баллов (в зависимости от количества индикаторов)

ВАЖНЫЕ ИСКЛЮЧЕНИЯ (НЕ считать подозрительным):
- Грамотность сама по себе — многие люди пишут грамотно
- Структурированность на технические вопросы — это нормально
- Профессиональная лексика в контексте специальности
- Короткие ответы (< 100 символов) — недостаточно данных для анализа

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- suspicionLevel: уровень подозрения
- confidence: уверенность в оценке (0-1)
- indicators: массив найденных индикаторов с type, description, weight
- shouldWarn: нужно ли предупредить кандидата
- warningType: тип предупреждения (none/soft/direct/strict/final)
- scorePenalty: штраф к итоговой оценке (0-30)
- analysis: краткий анализ для внутреннего использования`;

    super(
      "BotUsageDetector",
      AgentType.BOT_USAGE_DETECTOR,
      instructions,
      botUsageDetectorOutputSchema,
      config,
    );
  }

  protected validate(input: BotUsageDetectorInput): boolean {
    try {
      // Parse and validate input with Zod schema
      const result = botUsageDetectorInputSchema.safeParse(input);

      if (!result.success) {
        console.error(
          "BotUsageDetector validation failed:",
          result.error.format(),
        );
        return false;
      }

      // Update input with validated and computed values
      Object.assign(input, result.data);
      return true;
    } catch (error) {
      console.error("BotUsageDetector validation error:", error);
      return false;
    }
  }

  protected buildPrompt(
    input: BotUsageDetectorInput,
    context: BaseAgentContext,
  ): string {
    const history = (context.conversationHistory || [])
      .slice(-8)
      .map(
        (msg) =>
          `${msg.sender === "CANDIDATE" ? "Кандидат" : "Интервьюер"}: ${msg.content}`,
      )
      .join("\n");

    const charsPerSecond =
      input.responseTimeMs > 0
        ? input.messageLength / (input.responseTimeMs / 1000)
        : 0;
    const charsPerMinute = charsPerSecond * 60;

    return `ИСТОРИЯ ДИАЛОГА:
${history || "(начало диалога)"}

${input.questionContext ? `ВОПРОС, НА КОТОРЫЙ ОТВЕЧАЛ КАНДИДАТ:\n"${input.questionContext}"\n` : ""}
ТЕКУЩИЙ ОТВЕТ КАНДИДАТА:
"${input.currentMessage}"

МЕТРИКИ ОТВЕТА:
- Время ответа: ${input.responseTimeMs}ms (${(input.responseTimeMs / 1000).toFixed(1)} сек)
- Длина ответа: ${input.messageLength} символов
- Скорость набора: ${charsPerMinute.toFixed(0)} символов/мин
  (средняя скорость человека: 150-300 символов/мин)

Проанализируй ответ на признаки использования AI-ассистента и верни JSON.`;
  }
}
