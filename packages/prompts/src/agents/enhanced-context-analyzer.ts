/**
 * Улучшенный агент анализа контекста с AI SDK
 */

import { z } from "zod";
import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface EnhancedContextAnalysisInput {
  message: string;
  previousMessages?: Array<{ sender: string; content: string }>;
}

const enhancedContextAnalysisOutputSchema = z.object({
  messageType: z.enum([
    "QUESTION",
    "ANSWER",
    "ACKNOWLEDGMENT",
    "POSTPONE_REQUEST",
    "REFUSAL",
    "UNCLEAR",
    "PIN_CODE",
    "VERIFICATION_CODE",
    "GREETING",
    "FAREWELL",
  ]),
  intent: z.string(),
  requiresResponse: z.boolean(),
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  topics: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  extractedData: z
    .object({
      pinCode: z.string().optional(),
      verificationCode: z.string().optional(),
      phoneNumber: z.string().optional(),
      email: z.string().optional(),
    })
    .optional(),
});

export type EnhancedContextAnalysisOutput = z.infer<
  typeof enhancedContextAnalysisOutputSchema
>;

export class EnhancedContextAnalyzerAgent extends AIPoweredAgent<
  EnhancedContextAnalysisInput,
  EnhancedContextAnalysisOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedContextAnalyzer",
      AgentType.CONTEXT_ANALYZER,
      `Ты — эксперт по анализу коммуникаций в контексте HR-бота для собеседований.
Твоя задача — точно определить тип сообщения и извлечь важные данные.

ОСОБОЕ ВНИМАНИЕ к специальным типам сообщений:
- PIN_CODE: Пин-код для верификации (обычно 4-6 цифр)
- VERIFICATION_CODE: Код подтверждения из SMS/email
- GREETING: Приветствие в начале диалога
- FAREWELL: Прощание, завершение диалога

ВАЖНО: Если сообщение содержит только цифры или код, это скорее всего PIN_CODE или VERIFICATION_CODE.`,
      config,
    );
  }

  protected validate(input: EnhancedContextAnalysisInput): boolean {
    return !!input.message && input.message.trim().length > 0;
  }

  /**
   * Быстрая предварительная проверка на пин-код (без AI)
   * Оптимизация: если сообщение явно пин-код, можем сразу вернуть результат
   */
  private quickPinCodeCheck(
    message: string,
  ): EnhancedContextAnalysisOutput | null {
    const trimmed = message.trim();

    // Проверка на чистый пин-код: только цифры, 4-6 символов
    const pureDigitsMatch = trimmed.match(/^(\d{4,6})$/);
    if (pureDigitsMatch) {
      return {
        messageType: "PIN_CODE",
        intent: "Отправка пин-кода для верификации",
        requiresResponse: true,
        sentiment: "NEUTRAL",
        topics: ["верификация", "пин-код"],
        confidence: 0.95,
        extractedData: {
          pinCode: pureDigitsMatch[1],
        },
      };
    }

    // Проверка на пин-код с разделителями: "12 34", "12-34", "1 2 3 4"
    const spacedPinMatch = trimmed.match(
      /^(\d[\s-]*\d[\s-]*\d[\s-]*\d[\s-]*\d?\d?)$/,
    );
    if (spacedPinMatch) {
      const cleanPin = trimmed.replace(/[\s-]/g, "");
      if (cleanPin.length >= 4 && cleanPin.length <= 6) {
        return {
          messageType: "PIN_CODE",
          intent: "Отправка пин-кода для верификации",
          requiresResponse: true,
          sentiment: "NEUTRAL",
          topics: ["верификация", "пин-код"],
          confidence: 0.9,
          extractedData: {
            pinCode: cleanPin,
          },
        };
      }
    }

    return null;
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
1. Тип сообщения:
   - PIN_CODE: если это пин-код (4-6 цифр, может быть с пробелами/дефисами)
   - VERIFICATION_CODE: код подтверждения (цифры/буквы)
   - GREETING: приветствие ("привет", "здравствуйте", "добрый день")
   - FAREWELL: прощание ("пока", "до свидания", "спасибо, всё")
   - QUESTION: вопрос
   - ANSWER: ответ на вопрос
   - ACKNOWLEDGMENT: подтверждение ("ок", "хорошо", "понятно", "спасибо")
   - POSTPONE_REQUEST: просьба отложить ("позже", "не сейчас")
   - REFUSAL: отказ ("нет", "не хочу", "не буду")
   - UNCLEAR: непонятное сообщение

2. Основное намерение отправителя
3. Требуется ли ответ от бота
4. Эмоциональный тон
5. Основные темы
6. Извлечённые данные (если есть)

ПРАВИЛА ОПРЕДЕЛЕНИЯ ТИПА:
- Если сообщение состоит ТОЛЬКО из цифр (4-6 символов) → PIN_CODE
- Если сообщение содержит код формата "1234" или "12 34" → PIN_CODE
- Если есть слова "код", "пин" + цифры → PIN_CODE или VERIFICATION_CODE
- Простые "спасибо", "ок", эмодзи без текста → ACKNOWLEDGMENT, requiresResponse: false
- Приветствия в начале диалога → GREETING, requiresResponse: true

ФОРМАТ ОТВЕТА (JSON):
{
  "messageType": "PIN_CODE" | "VERIFICATION_CODE" | "GREETING" | "FAREWELL" | "QUESTION" | "ANSWER" | "ACKNOWLEDGMENT" | "POSTPONE_REQUEST" | "REFUSAL" | "UNCLEAR",
  "intent": "краткое описание намерения",
  "requiresResponse": true/false,
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "topics": ["тема1", "тема2"],
  "confidence": 0.0-1.0,
  "extractedData": {
    "pinCode": "если найден пин-код",
    "verificationCode": "если найден код верификации",
    "phoneNumber": "если найден телефон",
    "email": "если найден email"
  }
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
      // Быстрая проверка на пин-код (оптимизация)
      const quickCheck = this.quickPinCodeCheck(input.message);
      if (quickCheck) {
        return {
          success: true,
          data: quickCheck,
          metadata: {
            agentName: this.name,
            fastPath: true,
          },
        };
      }

      const prompt = this.buildPrompt(input, context);

      // Реальный AI-вызов
      const aiResponse = await this.generateAIResponse(prompt);

      // Используем метод с автоматическим исправлением JSON
      const expectedFormat = `{
  "messageType": "PIN_CODE" | "VERIFICATION_CODE" | "GREETING" | "FAREWELL" | "QUESTION" | "ANSWER" | "ACKNOWLEDGMENT" | "POSTPONE_REQUEST" | "REFUSAL" | "UNCLEAR",
  "intent": "string",
  "requiresResponse": boolean,
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "topics": ["string"],
  "confidence": number,
  "extractedData": {
    "pinCode": "string (optional)",
    "verificationCode": "string (optional)",
    "phoneNumber": "string (optional)",
    "email": "string (optional)"
  }
}`;

      const parsed = await this.parseJSONResponseWithRetry(
        aiResponse,
        enhancedContextAnalysisOutputSchema,
        expectedFormat,
      );

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
