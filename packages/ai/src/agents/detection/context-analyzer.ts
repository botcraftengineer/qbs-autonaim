/**
 * Агент для анализа контекста сообщения
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { RECRUITER_PERSONA } from "../core/persona";
import { AgentType, type BaseAgentContext } from "../core/types";

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
  extractedData: z.object({
    pinCode: z.string(),
  }),
});

export type ContextAnalyzerOutput = z.infer<typeof contextAnalyzerOutputSchema>;

export class ContextAnalyzerAgent extends BaseAgent<
  ContextAnalyzerInput,
  ContextAnalyzerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по анализу контекста сообщений. Тебе нужно определить интент кандидата.

КРИТЕРИИ ОПРЕДЕЛЕНИЯ ТИПА:

1. PIN_CODE: СТРОГО 4 цифры (например, "1234", "0000"). Ничего больше.

2. GREETING: Изолированное приветствие без других элементов:
   - "Здравствуйте", "Добрый день", "Привет"
   - requiresResponse: true (нужно ответить приветствием)

3. ACKNOWLEDGMENT: Изолированное подтверждение БЕЗ намерения продолжить:
   - "Ок", "Спасибо", "Понятно", "Хорошо" (одно слово)
   - requiresResponse: false (не требует ответа)

4. CONTINUATION: Согласие + намерение продолжить диалог:
   - "Привет, ок" (приветствие + согласие)
   - "Да, давайте" (согласие + призыв к действию)
   - "Хорошо, готов" (подтверждение + готовность)
   - "Ок, слушаю" (согласие + внимание)
   - requiresResponse: true (кандидат ждет продолжения)

5. QUESTION: Кандидат задает вопрос о вакансии, условиях, процессе.

6. ANSWER: Кандидат отвечает на заданный вопрос.

7. OTHER: Все остальное.

⚠️ КЛЮЧЕВОЕ ПРАВИЛО:
Если сообщение содержит ДВА элемента (приветствие + согласие, согласие + призыв), это CONTINUATION!
Если только ОДНО слово подтверждения — это ACKNOWLEDGMENT.

ПРИМЕРЫ:
- "Привет, ок" → CONTINUATION (приветствие + согласие = ждет продолжения)
- "Ок" → ACKNOWLEDGMENT (только подтверждение = не требует ответа)
- "Да, давайте" → CONTINUATION (согласие + призыв = ждет действия)
- "Спасибо" → ACKNOWLEDGMENT (только благодарность)
- "Хорошо, готов отвечать" → CONTINUATION (готовность + намерение)

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

    return `${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n\n` : ""}ТЕКУЩЕЕ СООБЩЕНИЕ: <message>${input.message}</message>

⚠️ АНАЛИЗИРУЙ ВНИМАТЕЛЬНО:
1. Это ОДНО слово подтверждения ("Ок", "Спасибо") → ACKNOWLEDGMENT
2. Это ДВА+ элемента ("Привет, ок", "Да, давайте") → CONTINUATION
3. Это 4 цифры → PIN_CODE
4. Это вопрос → QUESTION
5. Это развернутый ответ → ANSWER

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- messageType: тип сообщения (PIN_CODE | GREETING | QUESTION | ANSWER | ACKNOWLEDGMENT | CONTINUATION | OTHER)
- requiresResponse: требуется ли ответ бота (boolean)
  * ACKNOWLEDGMENT → false (не требует ответа)
  * CONTINUATION → true (кандидат ждет продолжения)
  * GREETING → true (нужно ответить приветствием)
- extractedData: объект с полем pinCode
  * pinCode: СТРОГО 4 цифры (например, "1234") если найден, иначе пустая строка ""`;
  }
}
