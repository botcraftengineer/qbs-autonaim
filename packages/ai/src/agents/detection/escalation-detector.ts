/**
 * Агент детектора эскалации
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface EscalationDetectorInput {
  message: string;
  failedPinAttempts?: number;
  conversationLength: number;
}

const escalationDetectorOutputSchema = z.object({
  shouldEscalate: z.boolean(),
  reason: z.string(),
  urgency: z.enum(["LOW", "MEDIUM", "HIGH"]),
  suggestedAction: z.string(),
});

export type EscalationDetectorOutput = z.infer<
  typeof escalationDetectorOutputSchema
>;

export class EscalationDetectorAgent extends BaseAgent<
  EscalationDetectorInput,
  EscalationDetectorOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по определению ситуаций, требующих вмешательства человека.

КРИТЕРИИ ЭСКАЛАЦИИ:
1. Множественные неудачные попытки PIN (≥3)
2. Агрессивное или неадекватное поведение
3. Сложные вопросы о компании/условиях
4. Технические проблемы
5. Запрос на общение с человеком
6. Жалобы или конфликтные ситуации

Поля "reason" и "suggestedAction" должны быть пустыми строками, если эскалация не требуется.`;

    super(
      "EscalationDetector",
      AgentType.ESCALATION_DETECTOR,
      instructions,
      escalationDetectorOutputSchema,
      config,
    );
  }

  protected validate(input: EscalationDetectorInput): boolean {
    return !!input.message;
  }

  protected buildPrompt(
    input: EscalationDetectorInput,
    _context: BaseAgentContext,
  ): string {
    return `КОНТЕКСТ:
- Количество неудачных попыток PIN: ${input.failedPinAttempts || 0}
- Длина диалога: ${input.conversationLength} сообщений

ПОСЛЕДНЕЕ СООБЩЕНИЕ:
"${input.message}"

Проанализируй ситуацию и определи, требуется ли эскалация к живому рекрутеру.

Верни JSON с полями:
- shouldEscalate: true/false
- reason: причина эскалации (пустая строка если не требуется)
- urgency: "LOW" | "MEDIUM" | "HIGH"
- suggestedAction: рекомендуемое действие (пустая строка если не требуется)`;
  }

  async execute(
    input: EscalationDetectorInput,
    context: BaseAgentContext,
  ): Promise<{
    success: boolean;
    data?: EscalationDetectorOutput;
    error?: string;
  }> {
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

    return super.execute(input, context);
  }
}
