/**
 * Агент для генерации финального сообщения после завершения интервью
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface InterviewCompletionInput {
  questionCount: number;
  score?: number;
  detailedScore?: number;
}

export interface InterviewCompletionOutput {
  finalMessage: string;
  confidence: number;
}

export class InterviewCompletionAgent extends AIPoweredAgent<
  InterviewCompletionInput,
  InterviewCompletionOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "InterviewCompletion",
      AgentType.EVALUATOR,
      "Ты — рекрутер, который только что закончил предварительное интервью с кандидатом в Telegram.",
      config,
    );
  }

  protected validate(input: InterviewCompletionInput): boolean {
    if (!Number.isFinite(input.questionCount) || input.questionCount < 0)
      return false;

    return true;
  }

  protected buildPrompt(
    input: InterviewCompletionInput,
    context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, conversationHistory } = context;

    const candidateNameText = candidateName
      ? `Имя кандидата: ${candidateName}`
      : "Имя кандидата не известно";

    const vacancyText = vacancyTitle
      ? `Вакансия: ${vacancyTitle}`
      : "Вакансия не указана";

    const scoreText =
      input.score !== undefined
        ? `\nОценка интервью: ${input.score}/5${input.detailedScore !== undefined ? ` (${input.detailedScore}/100)` : ""}`
        : "";

    // Формируем историю диалога для контекста
    const recentHistory = conversationHistory.slice(-10);
    const historyText =
      recentHistory.length > 0
        ? recentHistory
            .map((msg) => {
              const sender = msg.sender === "CANDIDATE" ? "Кандидат" : "Бот";
              return `${sender}: ${msg.content}`;
            })
            .join("\n")
        : "";

    return `${this.systemPrompt}

${historyText ? `ИСТОРИЯ ДИАЛОГА (последние сообщения для контекста):\n${historyText}\n` : ""}

КОНТЕКСТ:
${candidateNameText}
${vacancyText}
Количество вопросов: ${input.questionCount}${scoreText}

ТВОЯ ЗАДАЧА:
Напиши короткое финальное сообщение кандидату (1-2 предложения).

ПРАВИЛА:
- Поблагодари за уделённое время
- Сообщи, что скоро свяжешься с результатами
- Пиши естественно, как живой человек
- НЕ используй слово "Привет"
- Обращайся на "вы"
- Не используй шаблонные фразы типа "с уважением", "рады были познакомиться"
- НЕ упоминай оценки или баллы
- Максимум 1 эмодзи, если уместно
- ⚠️ КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНО говорить "передам работодателю", "передам руководству"
- Говори от первого лица: "я изучу", "я свяжусь", "я рассмотрю"

ПРИМЕРЫ ХОРОШИХ СООБЩЕНИЙ:
- "Отлично, спасибо за ответы! 🙏 Изучу всё и свяжусь с вами в ближайшее время."
- "Спасибо за беседу! Обработаю информацию и вернусь с обратной связью."
- "Благодарю за время! Скоро вернусь с результатами."

ПРИМЕРЫ ПЛОХИХ СООБЩЕНИЙ (НЕ ИСПОЛЬЗУЙ):
- ❌ "Передам работодателю"
- ❌ "Передам руководству"
- ❌ "Передам в компанию"
- ❌ "Отправлю на рассмотрение"

ФОРМАТ ОТВЕТА - ВЕРНИ ТОЛЬКО ВАЛИДНЫЙ JSON:
{
  "finalMessage": "текст финального сообщения",
  "confidence": число от 0.0 до 1.0
}

ВАЖНО: Верни ТОЛЬКО JSON, без дополнительного текста до или после.`;
  }

  async execute(
    input: InterviewCompletionInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<InterviewCompletionOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      const aiResponse = await this.generateAIResponse(prompt);

      const parsed =
        this.parseJSONResponse<InterviewCompletionOutput>(aiResponse);

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
