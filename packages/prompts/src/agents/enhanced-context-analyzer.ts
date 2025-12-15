/**
 * Улучшенный агент анализа контекста с AI SDK
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import type { AgentResult, BaseAgentContext } from "./types";

export interface EnhancedContextAnalysisInput {
  message: string;
  previousMessages?: Array<{ sender: string; content: string }>;
}

export interface EnhancedContextAnalysisOutput {
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

export class EnhancedContextAnalyzerAgent extends AIPoweredAgent<
  EnhancedContextAnalysisInput,
  EnhancedContextAnalysisOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedContextAnalyzer",
      AgentType.CONTEXT_ANALYZER,
      "Ты — эксперт по анализу коммуникаций. Твоя задача — понять намерения собеседника и определить тип сообщения.",
      config,
    );
  }

  protected validate(input: EnhancedContextAnalysisInput): boolean {
    return !!input.message && input.message.trim().length > 0;
  }

  protected buildPrompt(
    input: EnhancedContextAnalysisInput,
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
    input: EnhancedContextAnalysisInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EnhancedContextAnalysisOutput>> {
    if (!this.validate(input)) {
      return {
        success: false,
        error: "Некорректные входные данные: сообщение обязательно",
      };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Реальный AI-вызов
      const aiResponse = await this.generateAIResponse(prompt);
      const parsed =
        this.parseJSONResponse<EnhancedContextAnalysisOutput>(aiResponse);

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      return {
        success: true,
        data: parsed,
        metadata: {
          prompt,
          agentName: this.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
