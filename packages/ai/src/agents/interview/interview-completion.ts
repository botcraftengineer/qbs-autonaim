/**
 * Агент для генерации финального сообщения
 */

import { z } from "zod";
import { extractFirstName } from "../../utils/name-extractor";
import { type AgentConfig, BaseAgent } from "../core/base-agent";
import { AgentType, type BaseAgentContext } from "../core/types";

export interface InterviewCompletionInput {
  questionCount: number;
  score?: number;
  detailedScore?: number;
  resumeLanguage?: string;
}

const interviewCompletionOutputSchema = z.object({
  finalMessage: z.string(),
  confidence: z.number().min(0).max(1),
});

export type InterviewCompletionOutput = z.infer<
  typeof interviewCompletionOutputSchema
>;

export class InterviewCompletionAgent extends BaseAgent<
  InterviewCompletionInput,
  InterviewCompletionOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — рекрутер, который только что закончил предварительное интервью с кандидатом в Telegram.

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
- "Благодарю за время! Скоро вернусь с результатами."`;

    super(
      "InterviewCompletion",
      AgentType.EVALUATOR,
      instructions,
      interviewCompletionOutputSchema,
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
    const { resumeLanguage = "ru" } = input;

    const languageInstruction = `\n\n⚠️ АДАПТАЦИЯ К ЯЗЫКУ: 
- Изначальный язык резюме: "${resumeLanguage}"
- ВАЖНО: Посмотри на ИСТОРИЮ ДИАЛОГА ниже и определи, на каком языке общался кандидат
- Пиши финальное сообщение на том языке, на котором кандидат отвечал в последних сообщениях`;

    const name = extractFirstName(candidateName || null);
    const candidateNameText =
      name !== "кандидат"
        ? `Имя кандидата: ${name}`
        : "Имя кандидата не известно";

    const vacancyText = vacancyTitle
      ? `Вакансия: ${vacancyTitle}`
      : "Вакансия не указана";

    const scoreText =
      input.score !== undefined
        ? `\nОценка интервью: ${input.score}/5${input.detailedScore !== undefined ? ` (${input.detailedScore}/100)` : ""}`
        : "";

    const historyText =
      conversationHistory.length > 0
        ? conversationHistory
            .map((msg) => {
              const sender = msg.sender === "CANDIDATE" ? "Кандидат" : "Бот";
              return `${sender}: ${msg.content}`;
            })
            .join("\n")
        : "";

    return `${languageInstruction}

${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n` : ""}

КОНТЕКСТ:
${candidateNameText}
${vacancyText}
Количество вопросов: ${input.questionCount}${scoreText}

Напиши короткое финальное сообщение кандидату (1-2 предложения).

Верни JSON с полями:
- finalMessage: текст финального сообщения
- confidence: число от 0.0 до 1.0`;
  }
}
