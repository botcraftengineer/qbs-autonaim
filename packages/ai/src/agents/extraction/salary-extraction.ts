/**
 * Агент для извлечения зарплатных ожиданий
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface SalaryExtractionInput {
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
  }>;
}

const salaryExtractionOutputSchema = z.object({
  salaryExpectations: z.string(),
  confidence: z.number().min(0).max(1),
});

export type SalaryExtractionOutput = z.infer<
  typeof salaryExtractionOutputSchema
>;

export class SalaryExtractionAgent extends BaseAgent<
  SalaryExtractionInput,
  SalaryExtractionOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по анализу диалогов для извлечения зарплатных ожиданий кандидата.

ЗАДАЧА:
Проанализируй историю диалога и извлеки зарплатные ожидания кандидата.

ПРАВИЛА:
- Ищи упоминания зарплаты, оклада, компенсации
- Извлекай конкретные цифры и валюту
- Если кандидат указал диапазон - сохрани его
- Если зарплата не упоминалась - верни пустую строку
- Форматируй как: "50000-70000 руб" или "2000 USD" или "договорная"`;

    super(
      "SalaryExtraction",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      salaryExtractionOutputSchema,
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
    const historyText = input.conversationHistory
      .map((msg) => {
        const sender = msg.sender === "CANDIDATE" ? "Кандидат" : "Бот";
        return `${sender}: ${msg.content}`;
      })
      .join("\n");

    return `ИСТОРИЯ ДИАЛОГА:
${historyText}

Извлеки зарплатные ожидания кандидата из диалога.

Верни JSON с полями:
- salaryExpectations: строка с зарплатными ожиданиями (пустая строка если не упоминалось)
- confidence: число от 0.0 до 1.0 (уверенность в извлечении)`;
  }
}
