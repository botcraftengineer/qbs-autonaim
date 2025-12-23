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

    // Логируем успешную валидацию для отладки
    console.log("[InterviewerAgent] Validation passed:", {
      questionNumber: input.questionNumber,
    });

    return true;
  }

  protected buildPrompt(
    input: InterviewerInput,
    context: BaseAgentContext,
  ): string {
    const { candidateName, vacancyTitle, vacancyDescription } = context;
    const { resumeLanguage = "ru" } = input;

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

    // Оптимизация: обрезаем описание вакансии
    const shortVacancyDesc = vacancyDescription
      ? `${vacancyDescription.substring(0, 300)}${vacancyDescription.length > 300 ? "..." : ""}`
      : "";

    return `КОНТЕКСТ:
Язык резюме: <resume_language>${resumeLanguage}</resume_language>
Адаптируйся к языку ответов кандидата.

Бот: <bot_name>${botName}</bot_name>, <bot_role>${botRole}</bot_role>${companyName ? `, <company>${companyName}</company>` : ""}
Кандидат: <candidate_name>${name}</candidate_name>
Вакансия: <vacancy_title>${vacancyTitle || "не указана"}</vacancy_title>${shortVacancyDesc ? `\n<vacancy_description>${shortVacancyDesc}</vacancy_description>` : ""}

${organizationalQuestionsBlock}
${technicalQuestionsBlock}

${historyText ? `ИСТОРИЯ ДИАЛОГА:\n${historyText}\n` : ""}

ТЕКУЩЕЕ ВЗАИМОДЕЙСТВИЕ:
Номер вопроса: <question_number>${input.questionNumber}</question_number>
Первое взаимодействие: <is_first_interaction>${input.questionNumber === 1}</is_first_interaction>
Анализируй последнее сообщение кандидата из истории диалога.

ПРАВИЛА:

Логика интервью:
1. Анализируй историю диалога, чтобы понять контекст
2. Не повторяй вопросы из истории
3. Сначала организационные темы, потом технические
4. Если ответ полный - переходи к следующей теме
5. Если собрал достаточно - завершай (shouldContinue: false)

⚠️ ВАЖНО - ГОЛОСОВЫЕ СООБЩЕНИЯ:
- ВСЕГДА предлагай голосовые как УДОБНЫЙ вариант, но НЕ обязательный
- Если кандидат говорит "не могу записать голосовое", "нет микрофона", "только текстом":
  → Спокойно принимай это: "Без проблем, текстом отлично 🙂"
  → Продолжай интервью в текстовом формате
  → БОЛЬШЕ НЕ упоминай голосовые сообщения
- НЕ настаивай на голосовых, если кандидат предпочитает текст

⚠️ ОСОБЫЙ СЛУЧАЙ - ПЕРВОЕ ВЗАИМОДЕЙСТВИЕ:
Если is_first_interaction=true И последнее сообщение бота в истории - это приветствие (не содержит "?"), 
а ответ кандидата - короткое согласие ("Привет, ок", "Да, давайте"):
→ Это НЕ ответ на вопрос интервью!
→ Задай ПЕРВЫЙ реальный вопрос интервью (организационный)
→ НЕ анализируй "Привет, ок" как ответ

ЗАДАЧА:
Проанализируй ситуацию и определи действие:

a) ПЕРВОЕ ВЗАИМОДЕЙСТВИЕ (is_first_interaction=true + последнее сообщение бота без "?"):
   - Кандидат ответил на приветствие ("Привет, ок", "Да, давайте")
   - Это НЕ ответ на вопрос интервью
   → Задай ПЕРВЫЙ организационный вопрос
   → analysis: "Кандидат готов к интервью"
   → shouldContinue: true
   → nextQuestion: первый вопрос (график/зарплата/локация)

b) ОТКАЗ ОТ ГОЛОСОВЫХ ("не могу записать", "нет микрофона", "только текстом"):
   → Спокойно принимай: "Без проблем, текстом отлично 🙂"
   → Продолжай задавать вопросы в текстовом формате
   → НЕ упоминай голосовые больше
   → shouldContinue: true
   → nextQuestion: продолжи интервью

c) Простое подтверждение ("ок", "спасибо"):
   → shouldContinue: false
   → isSimpleAcknowledgment: true
   → nextQuestion: пустая строка

d) Вопрос/просьба отложить:
   → shouldContinue: true
   → waitingForCandidateResponse: true
   → nextQuestion: короткий ответ БЕЗ нового вопроса

e) Полный ответ на вопрос интервью:
   → Проанализируй ответ
   → Задай следующий вопрос или завершай

ВАЖНО:
- Если кандидат просто поздоровался/поблагодарил БЕЗ ответа - НЕ отвечай (isSimpleAcknowledgment: true)
- Если задал вопрос - ответь кратко (1-2 предложения) и жди (waitingForCandidateResponse: true)
- Если это первое взаимодействие - сразу задай первый вопрос интервью
- Если отказался от голосовых - спокойно продолжай текстом

ФОРМАТ ОТВЕТА:
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
