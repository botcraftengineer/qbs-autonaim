/**
 * Агент для обработки PIN-кода и идентификации кандидата
 * Отвечает ТОЛЬКО за валидацию PIN-кода, не задает вопросы интервью
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { RECRUITER_PERSONA } from "../core/persona";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface PinHandlerInput {
  messageText: string;
  stage: "AWAITING_PIN" | "INVALID_PIN";
  failedPinAttempts?: number;
}

const pinHandlerOutputSchema = z.object({
  responseMessage: z.string(),
  shouldSkip: z.boolean(),
  confidence: z.number().min(0).max(1),
});

export type PinHandlerOutput = z.infer<typeof pinHandlerOutputSchema>;

export class PinHandlerAgent extends BaseAgent<
  PinHandlerInput,
  PinHandlerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `${RECRUITER_PERSONA.INSTRUCTIONS}

⚠️ ТВОЯ ЕДИНСТВЕННАЯ ЗАДАЧА:
- Запросить 4-значный PIN-код для идентификации.
- Объяснить, где найти код (в чате HH.ru).
- Помочь, если кандидат не может найти код.
- НЕ задавать вопросы интервью и НЕ начинать его до ввода кода.

${RECRUITER_PERSONA.GREETING_RULES}`;

    super(
      "PinHandler",
      AgentType.SCREENER,
      instructions,
      pinHandlerOutputSchema,
      config,
    );
  }

  protected validate(input: PinHandlerInput): boolean {
    return !!input.messageText && !!input.stage;
  }

  protected buildPrompt(
    input: PinHandlerInput,
    context: BaseAgentContext,
  ): string {
    const { messageText, stage, failedPinAttempts = 0 } = input;
    const resumeLanguage = context.resumeData?.language || "ru";

    const historyText =
      context.conversationHistory.length > 0
        ? context.conversationHistory
            .map(
              (msg) =>
                `${msg.sender === "CANDIDATE" ? "Кандидат" : "Я"}: ${msg.content}`,
            )
            .join("\n")
        : "";

    let stageInstructions = "";

    switch (stage) {
      case "AWAITING_PIN":
        stageInstructions = `ЭТАП: ОЖИДАНИЕ PIN-КОДА
Статус: Кандидат еще не идентифицирован. Ты не можешь начать интервью без идентификации.

Задачи:
- Если это первое сообщение — поприветствуй и попроси 4-значный код
- Если кандидат написал что-то кроме 4-значного кода — мягко верни его к запросу кода
- Если кандидат прислал голосовое — объясни, что сначала нужен код для идентификации
- Объясни, что код нужен для идентификации
- НЕ начинай интервью, НЕ задавай вопросы о работе
- Пиши коротко и по делу (1-2 предложения максимум)

Примеры:
- Первое сообщение: "Добрый день! Отправьте 4-значный код, чтобы начать"
- Не код: "Для начала отправьте 4-значный код"
- Голосовое: "Сначала отправьте код, чтобы я понял, кто вы. Потом послушаю голосовое"
- Вопрос о коде: "Код из 4 цифр, который пришел в чат HH.ru. Проверьте переписку там"`;
        break;

      case "INVALID_PIN":
        stageInstructions = `ЭТАП: НЕВЕРНЫЙ PIN-КОД
Статус: Кандидат ввел неправильный 4-значный код
Попыток: <failed_attempts>${failedPinAttempts}</failed_attempts>

Задачи:
- Вежливо сообщи, что код не подошел
- Попроси проверить чат HH.ru и попробовать снова
- Объясни, что код должен быть 4-значным
- Пиши коротко и по делу

Примеры:
- "Код не подошел. Проверьте чат HH.ru и отправьте 4-значный код еще раз"
- "Этот код не найден. Убедитесь, что вводите код из чата HH.ru правильно"
- "Хм, код не совпадает. Возможно, опечатка? Попробуйте ещё раз"${failedPinAttempts >= 2 ? '\n- Много неудач: "Никак не получается? Напишите, я передам запрос коллеге"' : ""}`;
        break;
    }

    return `АДАПТАЦИЯ К ЯЗЫКУ:
Язык резюме: <resume_language>${resumeLanguage}</resume_language>
Правила:
- Если есть история диалога - анализируй язык сообщений кандидата
- Отвечай на том языке, на котором пишет кандидат
- Если истории нет - начни на языке резюме

${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n\n` : ""}${stageInstructions}

СООБЩЕНИЕ КАНДИДАТА: <message>${messageText}</message>

ФОРМАТ ОТВЕТА:
Верни JSON с полями:
- responseMessage: текст ответа (или пустая строка если shouldSkip: true)
- shouldSkip: true если не нужно отправлять сообщение (например, кандидат прислал "Ок")
- confidence: число от 0.0 до 1.0`;
  }
}
