/**
 * Агент для определения, было ли приветствие в истории диалога
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { AgentType, type BaseAgentContext } from "./types";

export interface GreetingDetectorInput {
  conversationHistory: Array<{
    sender: "CANDIDATE" | "BOT";
    content: string;
  }>;
}

const greetingDetectorOutputSchema = z.object({
  alreadyGreeted: z.boolean(),
  greetingMessage: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type GreetingDetectorOutput = z.infer<
  typeof greetingDetectorOutputSchema
>;

export class GreetingDetectorAgent extends BaseAgent<
  GreetingDetectorInput,
  GreetingDetectorOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — анализатор диалогов. Твоя задача — определить, было ли приветствие от бота в истории диалога.

ЗАДАЧА:
Проанализируй историю сообщений и определи, здоровался ли бот с кандидатом.

ПРИЗНАКИ ПРИВЕТСТВИЯ:
- Слова: "Добрый день", "Здравствуйте", "Hello", "Good day", "Hi", "Привет"
- Фразы: "Рад вас видеть", "Приятно познакомиться"
- Эмодзи приветствия: 👋, 🙂
- Контекст: первое сообщение от бота обычно содержит приветствие

ВАЖНО:
- Анализируй только сообщения от БОТА (sender: "BOT")
- Учитывай контекст и естественность языка
- Не считай приветствием простые ответы типа "Хорошо", "Понял"

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- alreadyGreeted: true если бот уже здоровался, false если нет
- greetingMessage: текст приветствия (если найдено)
- confidence: число от 0.0 до 1.0 (уверенность в определении)`;

    super(
      "GreetingDetector",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      greetingDetectorOutputSchema,
      config,
    );
  }

  protected validate(input: GreetingDetectorInput): boolean {
    return Array.isArray(input.conversationHistory);
  }

  protected buildPrompt(
    input: GreetingDetectorInput,
    _context: BaseAgentContext,
  ): string {
    const { conversationHistory } = input;

    const historyText =
      conversationHistory.length > 0
        ? conversationHistory
            .map(
              (msg) =>
                `${msg.sender === "CANDIDATE" ? "Кандидат" : "Бот"}: ${msg.content}`,
            )
            .join("\n")
        : "История пуста";

    return `ИСТОРИЯ ДИАЛОГА:
${historyText}

Проанализируй историю и определи, здоровался ли бот с кандидатом.

Верни JSON с полями:
- alreadyGreeted: true/false
- greetingMessage: текст приветствия (если найдено) или undefined
- confidence: число от 0.0 до 1.0`;
  }
}
