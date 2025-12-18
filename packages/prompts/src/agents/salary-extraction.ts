/**
 * Агент для извлечения зарплатных ожиданий из истории диалога
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface SalaryExtractionInput {
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
  }>;
}

export interface SalaryExtractionOutput {
  salaryExpectations: string;
  confidence: number;
}

export class SalaryExtractionAgent extends AIPoweredAgent<
  SalaryExtractionInput,
  SalaryExtractionOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "SalaryExtraction",
      AgentType.EVALUATOR,
      "Ты — аналитик, который извлекает зарплатные ожидания из диалога с кандидатом.",
      config,
    );
  }

  protected validate(input: SalaryExtractionInput): boolean {
    return Array.isArray(input.conversationHistory);
  }

  protected buildPrompt(
    input: SalaryExtractionInput,
    _context: BaseAgentContext,
  ): string {
    const candidateMessages = input.conversationHistory
      .filter((msg) => msg.sender === "CANDIDATE")
      .map((msg) => msg.content)
      .join("\n");

    return `${this.systemPrompt}

СООБЩЕНИЯ КАНДИДАТА:
${candidateMessages}

ЗАДАЧА:
Найди упоминания зарплатных ожиданий и верни их в кратком виде.

ПРАВИЛА:
- Если зарплата упоминалась: верни только цифры и валюту (например: "150000 руб", "100-120к", "от 80000")
- Если зарплата НЕ упоминалась: верни пустую строку
- Не добавляй пояснений
- Не придумывай данные
- Верни только то, что явно сказал кандидат

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "salaryExpectations": "строка с зарплатными ожиданиями или пустая строка",
  "confidence": число от 0.0 до 1.0
}

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста до или после.`;
  }

  async execute(
    input: SalaryExtractionInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<SalaryExtractionOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      const aiResponse = await this.generateAIResponse(prompt);

      const expectedFormat = `{
  "salaryExpectations": "string",
  "confidence": number
}`;

      const parsed = await this.parseJSONResponseWithRetry<SalaryExtractionOutput>(
        aiResponse,
        expectedFormat,
      );

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      // Валидация confidence
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
