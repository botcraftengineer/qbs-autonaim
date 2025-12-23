/**
 * Агент для проведения интервью
 */

import { z } from "zod";
import { extractFirstName } from "../utils/name-extractor";
import { wrapUserContent } from "../utils/sanitize";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { RECRUITER_PERSONA } from "./persona";
import { getConversationContext, getVoiceMessagesInfo } from "./tools";
import { AgentType, type BaseAgentContext } from "./types";

export interface InterviewerInput {
  currentAnswer: string;
  currentQuestion: string;
  previousQA: Array<{ question: string; answer: string }>;
  questionNumber: number;
  customOrganizationalQuestions?: string | null;
  customInterviewQuestions?: string | null; // Технические вопросы
  resumeLanguage?: string;
}

const interviewerOutputSchema = z.object({
  analysis: z.string(),
  shouldContinue: z.boolean(),
  reason: z.string(),
  nextQuestion: z.string(),
  confidence: z.number().min(0).max(1),
  waitingForCandidateResponse: z.boolean(),
  isSimpleAcknowledgment: z.boolean(),
});

export type InterviewerOutput = z.infer<typeof interviewerOutputSchema>;

export class InterviewerAgent extends BaseAgent<
  InterviewerInput,
  InterviewerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `${RECRUITER_PERSONA.INSTRUCTIONS}

ТВОЯ ЗАДАЧА:
- Проанализируй ответ кандидата на последний вопрос.
- Сформулируй следующий уточняющий или новый вопрос.
- Если интервью на организационном этапе — задавай вопросы о графике, зарплате, локации.
- Если на техническом — углубляйся в опыт и навыки.
- Используй инструменты для анализа истории, если это необходимо.

${RECRUITER_PERSONA.GREETING_RULES}`;

    super(
      "Interviewer",
      AgentType.INTERVIEWER,
      instructions,
      interviewerOutputSchema,
      {
        ...config,
        tools: {
          getVoiceMessagesInfo,
          getConversationContext,
        },
      },
    );
  }

  protected validate(input: InterviewerInput): boolean {
    // Проверяем обязательные поля
    if (!input.currentAnswer || typeof input.currentAnswer !== "string") {
      console.error(
        "[InterviewerAgent] Invalid currentAnswer:",
        JSON.stringify({
          currentAnswer: input.currentAnswer,
          type: typeof input.currentAnswer,
        }),
      );
      return false;
    }

    if (!input.currentQuestion || typeof input.currentQuestion !== "string") {
      console.error(
        "[InterviewerAgent] Invalid currentQuestion:",
        JSON.stringify({
          currentQuestion: input.currentQuestion,
          type: typeof input.currentQuestion,
        }),
      );
      return false;
    }

    if (!Number.isFinite(input.questionNumber) || input.questionNumber < 0) {
      console.error(
        "[InterviewerAgent] Invalid questionNumber:",
        JSON.stringify({
          questionNumber: input.questionNumber,
          type: typeof input.questionNumber,
        }),
      );
      return false;
    }

    if (!Array.isArray(input.previousQA)) {
      console.error(
        "[InterviewerAgent] Invalid previousQA:",
        JSON.stringify({
          previousQA: input.previousQA,
          type: typeof input.previousQA,
        }),
      );
      return false;
    }

    // Логируем успешную валидацию для отладки
    console.log("[InterviewerAgent] Validation passed:", {
      currentAnswerLength: input.currentAnswer.length,
      currentQuestionLength: input.currentQuestion.length,
      questionNumber: input.questionNumber,
      previousQALength: input.previousQA.length,
    });

    return true;
  }

  protected buildPrompt(
    input: InterviewerInput,
    context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, vacancyDescription } = context;
    const { resumeLanguage = "en" } = input;

    const name = extractFirstName(candidateName || null);
    const botName = context.companySettings?.botName || "Дмитрий";
    const botRole = context.companySettings?.botRole || "рекрутер";
    const companyName = context.companySettings?.name || "";

    // Оптимизация: берем только последние 5 сообщений и обрезаем длинные
    const recentHistory = context.conversationHistory.slice(-5);
    const historyText =
      recentHistory.length > 0
        ? recentHistory
            .map((msg) => {
              const sender = msg.sender === "CANDIDATE" ? "К" : "Я";
              const content =
                msg.content.length > 200
                  ? `${msg.content.substring(0, 200)}...`
                  : msg.content;
              return `${sender}: ${content}`;
            })
            .join("\n")
        : "";

    // Оптимизация: обрезаем длинные кастомные вопросы
    const organizationalQuestionsBlock = input.customOrganizationalQuestions
      ? wrapUserContent(
          input.customOrganizationalQuestions.substring(0, 500),
          "organizational-questions",
          "ОРГАНИЗАЦИОННЫЕ ТЕМЫ:",
        )
      : "";

    const technicalQuestionsBlock = input.customInterviewQuestions
      ? wrapUserContent(
          input.customInterviewQuestions.substring(0, 500),
          "technical-questions",
          "ТЕХНИЧЕСКИЕ ТЕМЫ:",
        )
      : "";

    // Оптимизация: берем только последние 3 пары вопрос-ответ и обрезаем длинные ответы
    const recentQA = input.previousQA.slice(-3);
    const previousQAText =
      recentQA.length > 0
        ? `ПОСЛЕДНИЕ ВОПРОСЫ:\n${recentQA
            .map((qa, i) => {
              const answer =
                qa.answer.length > 150
                  ? `${qa.answer.substring(0, 150)}...`
                  : qa.answer;
              return `${i + 1}. В: ${qa.question}\n   О: ${answer}`;
            })
            .join("\n")}`
        : "";

    // Оптимизация: обрезаем описание вакансии
    const shortVacancyDesc = vacancyDescription
      ? `${vacancyDescription.substring(0, 300)}${vacancyDescription.length > 300 ? "..." : ""}`
      : "";

    return `Язык резюме: ${resumeLanguage}. Адаптируйся к языку ответов кандидата.

${organizationalQuestionsBlock}
${technicalQuestionsBlock}

${historyText ? `ИСТОРИЯ:\n${historyText}\n` : ""}

КОНТЕКСТ:
- Ты: ${botName} (${botRole}${companyName ? ` в ${companyName}` : ""})
- Кандидат: ${name}
- Вакансия: ${vacancyTitle || "не указана"}
${shortVacancyDesc ? `- Описание: ${shortVacancyDesc}` : ""}

ЛОГИКА:
1. Не повторяй вопросы из истории
2. Сначала организационные темы, потом технические
3. Если ответ полный - переходи к следующей теме
4. Если собрал достаточно - завершай (shouldContinue: false)

ТЕКУЩИЙ ВОПРОС:
${input.currentQuestion}

${previousQAText}

ОТВЕТ КАНДИДАТА:
${input.currentAnswer}

ЗАДАЧА:
1. Проанализируй ответ
2. Определи ситуацию:
   - Простое подтверждение ("ок", "спасибо") → shouldContinue: false, isSimpleAcknowledgment: true
   - Вопрос/просьба отложить → shouldContinue: true, waitingForCandidateResponse: true, короткий ответ БЕЗ нового вопроса
   - Полный ответ → задай следующий вопрос

ВАЖНО:
- Если кандидат просто поздоровался/поблагодарил БЕЗ ответа - НЕ отвечай (isSimpleAcknowledgment: true)
- Если задал вопрос - ответь кратко (1-2 предложения) и жди (waitingForCandidateResponse: true)

Верни JSON:
- analysis: краткая оценка (HTML: <p>, <strong>, <br>)
- shouldContinue: true/false
- reason: причина завершения (пустая строка если продолжаем)
- nextQuestion: следующее сообщение (пустая строка если завершаем)
- confidence: 0.0-1.0
- waitingForCandidateResponse: true если ждем ответа, иначе false
- isSimpleAcknowledgment: true если простое подтверждение, иначе false`;
  }
}
