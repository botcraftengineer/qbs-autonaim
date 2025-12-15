/**
 * Агент для определения необходимости эскалации к живому рекрутеру
 */

import { BaseAgent } from "./base-agent";
import type { AgentResult, AgentType, BaseAgentContext } from "./types";

export interface EscalationInput {
  message: string;
  failedPinAttempts?: number;
  conversationLength: number;
}

export interface EscalationOutput {
  shouldEscalate: boolean;
  reason?: string;
  urgency: "LOW" | "MEDIUM" | "HIGH";
  suggestedAction?: string;
}

export class EscalationDetectorAgent extends BaseAgent<
  EscalationInput,
  EscalationOutput
> {
  constructor() {
    super(
      "EscalationDetector",
      "escalation_detector" as AgentType,
      `Ты — эксперт по определению ситуаций, требующих вмешательства человека.`,
    );
  }

  protected validate(input: EscalationInput): boolean {
    return !!input.message;
  }

  protected buildPrompt(
    input: EscalationInput,
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
  "reason": "причина эскалации",
  "urgency": "LOW" | "MEDIUM" | "HIGH",
  "suggestedAction": "рекомендуемое действие"
}`;
  }

  async execute(
    input: EscalationInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EscalationOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Invalid input" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

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

      // Здесь будет AI-вызов для более сложных случаев
      const mockResult: EscalationOutput = {
        shouldEscalate: false,
        urgency: "LOW",
      };

      return { success: true, data: mockResult, metadata: { prompt } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
