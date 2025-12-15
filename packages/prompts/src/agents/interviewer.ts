/**
 * Агент для проведения интервью
 */

import { BaseAgent } from "./base-agent";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface InterviewerInput {
  message: string;
  voiceMessagesCount: number;
  maxVoiceMessages: number;
  questionsAsked: number;
  customQuestions?: string | null;
}

export interface InterviewerOutput {
  response: string;
  shouldRequestVoice: boolean;
  questionType?: "ORGANIZATIONAL" | "PROFESSIONAL" | "CLARIFICATION";
  shouldContinue: boolean;
}

export class InterviewerAgent extends BaseAgent<
  InterviewerInput,
  InterviewerOutput
> {
  constructor() {
    super(
      "Interviewer",
      AgentType.INTERVIEWER,
      `Ты — опытный рекрутер, проводящий интервью через Telegram.`,
    );
  }

  protected validate(input: InterviewerInput): boolean {
    return !!input.message;
  }

  protected buildPrompt(
    input: InterviewerInput,
    context: BaseAgentContext,
  ): string {
    const hasEnoughVoices = input.voiceMessagesCount >= input.maxVoiceMessages;
    const needsFirstVoice = input.voiceMessagesCount === 0;

    let voiceStrategy = "";
    if (needsFirstVoice) {
      voiceStrategy = `
⚠️ ЗАПРОС ПЕРВОГО ГОЛОСОВОГО (${input.voiceMessagesCount + 1}/${input.maxVoiceMessages})
Фокус: ОРГАНИЗАЦИОННЫЕ ВОПРОСЫ
- Попроси записать голосовое с вопросами о графике, зарплате, сроках
- Объясни, что так быстрее познакомиться
- Если отказ - принимай текст`;
    } else if (!hasEnoughVoices) {
      voiceStrategy = `
⚠️ ЗАПРОС ГОЛОСОВОГО ${input.voiceMessagesCount + 1}/${input.maxVoiceMessages}
Фокус: ПРОФЕССИОНАЛЬНЫЙ ОПЫТ
- Попроси рассказать про опыт, навыки, проекты
- 2-4 релевантных вопроса`;
    } else {
      voiceStrategy = `
✅ ВСЕ ГОЛОСОВЫЕ ПОЛУЧЕНЫ (${input.voiceMessagesCount}/${input.maxVoiceMessages})
- ЗАПРЕЩЕНО просить еще голосовые
- Отвечай на вопросы текстом
- Предлагай следующие шаги`;
    }

    const customQuestionsText = input.customQuestions
      ? `\n\nКАСТОМНЫЕ ВОПРОСЫ:\n${input.customQuestions}`
      : "";

    return `${this.systemPrompt}

${voiceStrategy}${customQuestionsText}

ИСТОРИЯ:
${context.conversationHistory
  .slice(-5)
  .map((m) => `${m.sender}: ${m.content}`)
  .join("\n")}

НОВОЕ СООБЩЕНИЕ:
"${input.message}"

ПРАВИЛА:
- Обращайся на "вы"
- Используй "Добрый день", НЕ "Привет"
- Коротко: 1-2 предложения
- Без шаблонов и излишней восторженности
- НЕ отвечай на "спасибо", "ок", эмодзи без текста

ФОРМАТ ОТВЕТА (JSON):
{
  "response": "текст ответа кандидату",
  "shouldRequestVoice": true/false,
  "questionType": "ORGANIZATIONAL" | "PROFESSIONAL" | "CLARIFICATION" | null,
  "shouldContinue": true/false
}`;
  }

  async execute(
    input: InterviewerInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<InterviewerOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Базовый ответ без AI
      // Для AI-генерации используйте EnhancedInterviewerAgent
      const needsVoice = input.voiceMessagesCount < input.maxVoiceMessages;

      return {
        success: true,
        data: {
          response: needsVoice
            ? "Расскажите, пожалуйста, подробнее о вашем опыте голосовым сообщением"
            : "Спасибо за информацию. Расскажите подробнее о ваших навыках",
          shouldRequestVoice: needsVoice,
          questionType: needsVoice ? "ORGANIZATIONAL" : "PROFESSIONAL",
          shouldContinue: true,
        },
        metadata: { prompt },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
