/**
 * Улучшенный агент детектора эскалации с AI SDK
 */

import { z } from "zod";
import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import type { AgentResult, BaseAgentContext } from "./types";
import { AgentType } from "./types";

export interface EnhancedEscalationInput {
  message: string;
  failedPinAttempts?: number;
  conversationLength: number;
}

const enhancedEscalationOutputSchema = z.object({
  shouldEscalate: z.boolean(),
  reason: z.string().optional(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  suggestedAction: z.string().optional(),
});

export type EnhancedEscalationOutput = z.infer<
  typeof enhancedEscalationOutputSchema
>;

export class EnhancedEscalationDetectorAgent extends AIPoweredAgent<
  EnhancedEscalationInput,
  EnhancedEscalationOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedEscalationDetector",
      AgentType.ESCALATION_DETECTOR,
      "Ты — эксперт по определению ситуаций, требующих вмешательства человека.",
      config,
    );
  }

  protected validate(input: EnhancedEscalationInput): boolean {
    return !!input.message;
  }

  protected buildPrompt(
    input: EnhancedEscalationInput,
    _context: BaseAgentContext,
  ): string {
    return `${this.systemPrompt}

КОНТЕКСТ:
- Количество неудачных попыток PIN: ${input.failedPinAttempts || 0}
- Длина диалога: ${input.conversationLength} сообщений

ПОСЛЕДНЕЕ СООБЩЕНИЕ:
"${input.message}"

КРИТЕРИИ ЭСКАЛАЦИИ:
1. Множественные неудачные попытки PIN (≥3)
2. Агрессивное или неадекватное поведение
3. Сложные вопросы о компании/условиях
4. Технические проблемы
5. Запрос на общение с человеком
6. Жалобы или конфликтные ситуации

ФОРМАТ ОТВЕТА (JSON):
{
  "shouldEscalate": true/false,
  "reason": "причина эскалации (опционально)",
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "suggestedAction": "рекомендуемое действие (опционально)"
}

Поля "reason" и "suggestedAction" можно опустить, если эскалация не требуется.`;
  }

  async execute(
    input: EnhancedEscalationInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EnhancedEscalationOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      // Синхронная проверка критических условий
      if (input.failedPinAttempts && input.failedPinAttempts >= 3) {
        return {
          success: true,
          data: {
            shouldEscalate: true,
            reason: "Множественные неудачные попытки PIN",
            urgency: "HIGH",
            suggestedAction: "Немедленная передача живому рекрутеру",
          },
        };
      }

      const prompt = this.buildPrompt(input, context);

      // Реальный AI-вызов для более сложных случаев
      const aiResponse = await this.generateAIResponse(prompt);

      const expectedFormat = `{
  "shouldEscalate": boolean,
  "reason": "string (optional)",
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "suggestedAction": "string (optional)"
}`;

      const parsed = await this.parseJSONResponseWithRetry(
        aiResponse,
        enhancedEscalationOutputSchema,
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
