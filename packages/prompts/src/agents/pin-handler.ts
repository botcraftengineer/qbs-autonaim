/**
 * Агент для обработки PIN-кода и идентификации кандидата
 * Отвечает ТОЛЬКО за валидацию PIN-кода, не задает вопросы интервью
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { RECRUITER_PERSONA } from "./persona";
import { AgentType, type BaseAgentContext } from "./types";

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
            .slice(-5)
            .map(
              (msg) =>
                `  <message sender="${msg.sender}">\n    <role>${msg.sender === "CANDIDATE" ? "Кандидат" : "Я"}</role>\n    <content>${msg.content}</content>\n  </message>`,
            )
            .join("\n")
        : "";

    let stageInstructions = "";

    switch (stage) {
      case "AWAITING_PIN":
        stageInstructions = `<stage type="AWAITING_PIN">
  <status>Кандидат еще не идентифицирован. Ты не можешь начать интервью без идентификации.</status>
  
  <tasks>
    - Если это первое сообщение — поприветствуй и попроси 4-значный код
    - Если кандидат написал что-то кроме 4-значного кода — мягко верни его к запросу кода
    - Если кандидат прислал голосовое — объясни, что сначала нужен код для идентификации
    - Объясни, что код нужен для идентификации
    - НЕ начинай интервью, НЕ задавай вопросы о работе
    - Пиши коротко и по делу (1-2 предложения максимум)
  </tasks>
  
  <examples>
    <example case="first_message">Добрый день! Отправьте 4-значный код, чтобы начать</example>
    <example case="not_a_code">Для начала отправьте 4-значный код</example>
    <example case="voice_message">Сначала отправьте код, чтобы я понял, кто вы. Потом послушаю голосовое</example>
    <example case="asking_what_code">Код из 4 цифр, который пришел в чат HH.ru. Проверьте переписку там</example>
  </examples>
</stage>`;
        break;

      case "INVALID_PIN":
        stageInstructions = `<stage type="INVALID_PIN">
  <status>Кандидат ввел неправильный 4-значный код</status>
  <failed_attempts>${failedPinAttempts}</failed_attempts>
  
  <tasks>
    - Вежливо сообщи, что код не подошел
    - Попроси проверить чат HH.ru и попробовать снова
    - Объясни, что код должен быть 4-значным
    - Пиши коротко и по делу
  </tasks>
  
  <examples>
    <example>Код не подошел. Проверьте чат HH.ru и отправьте 4-значный код еще раз</example>
    <example>Этот код не найден. Убедитесь, что вводите код из чата HH.ru правильно</example>
    <example>Хм, код не совпадает. Возможно, опечатка? Попробуйте ещё раз</example>
    ${failedPinAttempts >= 2 ? '<example case="multiple_failures">Никак не получается? Напишите, я передам запрос коллеге</example>' : ""}
  </examples>
</stage>`;
        break;
    }

    return `<language_adaptation>
  <resume_language>${resumeLanguage}</resume_language>
  <rules>
    - Если есть история диалога - анализируй язык сообщений кандидата
    - Отвечай на том языке, на котором пишет кандидат
    - Если истории нет - начни на языке резюме
  </rules>
</language_adaptation>

${historyText ? `<conversation_history>\n${historyText}\n</conversation_history>\n` : ""}

${stageInstructions}

<candidate_message>
  <content>${messageText}</content>
</candidate_message>

<output_format>
  Верни JSON с полями:
  - responseMessage: текст ответа (или пустая строка если shouldSkip: true)
  - shouldSkip: true если не нужно отправлять сообщение (например, кандидат прислал "Ок")
  - confidence: число от 0.0 до 1.0
</output_format>`;
  }
}
