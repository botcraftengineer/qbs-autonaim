/**
 * Агент для анализа контекста сообщения
 * Определяет намерения кандидата, тип сообщения, необходимость ответа
 */

import { BaseAgent } from "./base-agent";
import type { AgentResult, BaseAgentContext } from "./types";
import { AgentType } from "./types";

export interface ContextAnalysisInput {
  message: string;
  previousMessages?: Array<{ sender: string; content: string }>;
}

export interface ContextAnalysisOutput {
  messageType:
    | "QUESTION"
    | "ANSWER"
    | "ACKNOWLEDGMENT"
    | "POSTPONE_REQUEST"
    | "REFUSAL"
    | "UNCLEAR";
  intent: string;
  requiresResponse: boolean;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  topics: string[];
  confidence: number;
}

export class ContextAnalyzerAgent extends BaseAgent<
  ContextAnalysisInput,
  ContextAnalysisOutput
> {
  constructor() {
    super(
      "ContextAnalyzer",
      AgentType.CONTEXT_ANALYZER,
      `Ты — эксперт по анализу коммуникаций. Твоя задача — понять намерения собеседника и определить тип сообщения.`,
    );
  }

  protected validate(input: ContextAnalysisInput): boolean {
    return !!input.message && input.message.trim().length > 0;
  }

  protected buildPrompt(
    input: ContextAnalysisInput,
    _context: BaseAgentContext,
  ): string {
    const historyText = input.previousMessages
      ?.slice(-5)
      .map((msg) => `${msg.sender}: ${msg.content}`)
      .join("\n");

    return `${this.systemPrompt}

${historyText ? `КОНТЕКСТ ДИАЛОГА:\n${historyText}\n` : ""}

НОВОЕ СООБЩЕНИЕ:
"${input.message}"

ЗАДАЧА:
Проанализируй сообщение и определи:
1. Тип сообщения (вопрос, ответ, благодарность, просьба отложить, отказ, непонятно)
2. Основное намерение отправителя
3. Требуется ли ответ (НЕ отвечай на простые "спасибо", "ок", эмодзи без текста)
4. Эмоциональный тон (позитивный, нейтральный, негативный)
5. Основные темы сообщения

ФОРМАТ ОТВЕТА (JSON):
{
  "messageType": "QUESTION" | "ANSWER" | "ACKNOWLEDGMENT" | "POSTPONE_REQUEST" | "REFUSAL" | "UNCLEAR",
  "intent": "краткое описание намерения",
  "requiresResponse": true/false,
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "topics": ["тема1", "тема2"],
  "confidence": 0.0-1.0
}`;
  }

  async execute(
    input: ContextAnalysisInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<ContextAnalysisOutput>> {
    if (!this.validate(input)) {
      return {
        success: false,
        error: "Invalid input: message is required",
      };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Базовый анализ без AI - считаем что требуется ответ
      // Для детального AI-анализа используйте EnhancedContextAnalyzerAgent
      return {
        success: true,
        data: {
          messageType: "QUESTION",
          intent: "Сообщение от кандидата",
          requiresResponse: true,
          sentiment: "NEUTRAL",
          topics: [],
          confidence: 0.5,
        },
        metadata: {
          prompt,
          agentName: this.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
