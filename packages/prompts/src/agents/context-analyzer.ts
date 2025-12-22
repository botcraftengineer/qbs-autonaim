/**
 * Агент для анализа контекста сообщения
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { AgentType, type BaseAgentContext } from "./types";

export interface ContextAnalyzerInput {
  message: string;
  previousMessages: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
  }>;
}

const contextAnalyzerOutputSchema = z.object({
  messageType: z.enum([
    "PIN_CODE",
    "GREETING",
    "QUESTION",
    "ANSWER",
    "ACKNOWLEDGMENT",
    "OTHER",
  ]),
  requiresResponse: z.boolean(),
  extractedData: z
    .object({
      pinCode: z.string().optional(),
    })
    .optional(),
});

export type ContextAnalyzerOutput = z.infer<typeof contextAnalyzerOutputSchema>;

export class ContextAnalyzerAgent extends BaseAgent<
  ContextAnalyzerInput,
  ContextAnalyzerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по анализу контекста сообщений в диалоге.

ЗАДАЧА:
Определи тип сообщения и извлеки важные данные.

ТИПЫ СООБЩЕНИЙ:
- PIN_CODE: сообщение содержит пин-код (4-6 цифр)
- GREETING: приветствие ("Привет", "Здравствуйте", "Добрый день")
- QUESTION: вопрос от кандидата
- ANSWER: ответ на вопрос бота
- ACKNOWLEDGMENT: простое подтверждение ("Ок", "Спасибо", "Да")
- OTHER: другое

ПРАВИЛА:
- Если сообщение содержит 4-6 цифр подряд - это PIN_CODE
- Извлекай пин-код в extractedData.pinCode
- ACKNOWLEDGMENT не требует ответа (requiresResponse: false)`;

    super(
      "ContextAnalyzer",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      contextAnalyzerOutputSchema,
      config,
    );
  }

  protected validate(input: ContextAnalyzerInput): boolean {
    return !!input.message;
  }

  protected buildPrompt(
    input: ContextAnalyzerInput,
    _context: BaseAgentContext,
  ): string {
    const historyText =
      input.previousMessages.length > 0
        ? input.previousMessages
            .map((msg) => {
              const sender = msg.sender === "CANDIDATE" ? "Кандидат" : "Бот";
              return `${sender}: ${msg.content}`;
            })
            .join("\n")
        : "";

    return `${historyText ? `ИСТОРИЯ:\n${historyText}\n\n` : ""}ТЕКУЩЕЕ СООБЩЕНИЕ:
"${input.message}"

Проанализируй сообщение и определи его тип.

Верни JSON с полями:
- messageType: тип сообщения
- requiresResponse: требуется ли ответ (boolean)
- extractedData: извлеченные данные (опционально)
  - pinCode: пин-код если найден (опционально)`;
  }
}
