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

    return `<context>
  <language>
    <resume>${resumeLanguage}</resume>
    <instruction>Адаптируйся к языку ответов кандидата</instruction>
  </language>

  <bot>
    <name>${botName}</name>
    <role>${botRole}</role>
    ${companyName ? `<company>${companyName}</company>` : ""}
  </bot>

  <candidate>
    <name>${name}</name>
  </candidate>

  <vacancy>
    <title>${vacancyTitle || "не указана"}</title>
    ${shortVacancyDesc ? `<description>${shortVacancyDesc}</description>` : ""}
  </vacancy>

  ${organizationalQuestionsBlock ? `<organizational_topics>\n${input.customOrganizationalQuestions?.substring(0, 500)}\n</organizational_topics>\n` : ""}
  ${technicalQuestionsBlock ? `<technical_topics>\n${input.customInterviewQuestions?.substring(0, 500)}\n</technical_topics>\n` : ""}
</context>

${historyText ? `<conversation_history>\n${historyText}\n</conversation_history>\n` : ""}

${previousQAText ? `<previous_qa>\n${recentQA.map((qa, i) => `<qa id="${i + 1}">\n  <question>${qa.question}</question>\n  <answer>${qa.answer.length > 150 ? `${qa.answer.substring(0, 150)}...` : qa.answer}</answer>\n</qa>`).join("\n")}\n</previous_qa>\n` : ""}

<current_interaction>
  <question>${input.currentQuestion}</question>
  <answer>${input.currentAnswer}</answer>
  <question_number>${input.questionNumber}</question_number>
  <is_first_interaction>${input.previousQA.length === 0}</is_first_interaction>
</current_interaction>

<rules>
  <logic>
    1. Не повторяй вопросы из истории
    2. Сначала организационные темы, потом технические
    3. Если ответ полный - переходи к следующей теме
    4. Если собрал достаточно - завершай (shouldContinue: false)
  </logic>

  <first_interaction_case>
    ⚠️ ОСОБЫЙ СЛУЧАЙ - ПЕРВОЕ ВЗАИМОДЕЙСТВИЕ:
    Если is_first_interaction=true И текущий "вопрос" - это приветствие (не содержит "?"), 
    а ответ кандидата - короткое согласие ("Привет, ок", "Да, давайте"):
    → Это НЕ ответ на вопрос интервью!
    → Задай ПЕРВЫЙ реальный вопрос интервью (организационный)
    → НЕ анализируй "Привет, ок" как ответ
  </first_interaction_case>
</rules>

<task>
  Проанализируй ситуацию и определи действие:

  a) ПЕРВОЕ ВЗАИМОДЕЙСТВИЕ (is_first_interaction=true + вопрос без "?"):
     - Кандидат ответил на приветствие ("Привет, ок", "Да, давайте")
     - Это НЕ ответ на вопрос интервью
     → Задай ПЕРВЫЙ организационный вопрос
     → analysis: "Кандидат готов к интервью"
     → shouldContinue: true
     → nextQuestion: первый вопрос (график/зарплата/локация)
  
  b) Простое подтверждение ("ок", "спасибо"):
     → shouldContinue: false
     → isSimpleAcknowledgment: true
     → nextQuestion: пустая строка
  
  c) Вопрос/просьба отложить:
     → shouldContinue: true
     → waitingForCandidateResponse: true
     → nextQuestion: короткий ответ БЕЗ нового вопроса
  
  d) Полный ответ на вопрос интервью:
     → Проанализируй ответ
     → Задай следующий вопрос или завершай

  ВАЖНО:
  - Если кандидат просто поздоровался/поблагодарил БЕЗ ответа - НЕ отвечай (isSimpleAcknowledgment: true)
  - Если задал вопрос - ответь кратко (1-2 предложения) и жди (waitingForCandidateResponse: true)
  - Если это первое взаимодействие - сразу задай первый вопрос интервью
</task>

<output_format>
  Верни JSON:
  - analysis: краткая оценка (HTML: <p>, <strong>, <br>)
  - shouldContinue: true/false
  - reason: причина завершения (пустая строка если продолжаем)
  - nextQuestion: следующее сообщение (пустая строка если завершаем)
  - confidence: 0.0-1.0
  - waitingForCandidateResponse: true если ждем ответа, иначе false
  - isSimpleAcknowledgment: true если простое подтверждение, иначе false
</output_format>`;
  }
}
