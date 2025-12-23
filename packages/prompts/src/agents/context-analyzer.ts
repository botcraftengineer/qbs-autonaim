/**
 * Агент для анализа контекста сообщения
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { RECRUITER_PERSONA } from "./persona";
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
    "CONTINUATION", // Новый тип: кандидат продолжает свой ответ
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
    const instructions = `Ты — эксперт по анализу контекста сообщений. Тебе нужно определить интент кандидата.

КРИТЕРИИ:
- PIN_CODE: STRICTLY 4 digits (e.g., "1234").
- GREETING: "Здравствуйте", "Добрый день".
- ACKNOWLEDGMENT: ТОЛЬКО если это изолированное подтверждение БЕЗ продолжения ("Ок", "Спасибо", "Понятно") (requiresResponse: false).
- CONTINUATION: Короткое согласие с намерением продолжить ("Привет, ок", "Да, давайте", "Хорошо, готов") (requiresResponse: true).
- QUESTION: Кандидат спрашивает о вакансии или условиях.
- ANSWER: Кандидат отвечает на твой вопрос.

ВАЖНО: Если сообщение содержит приветствие + согласие ("Привет, ок"), это CONTINUATION, а не ACKNOWLEDGMENT!

${RECRUITER_PERSONA.LANGUAGE_RULES}`;

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
  - pinCode: СТРОГО 4 цифры (например, "1234") если найден (опционально)`;
  }
}
