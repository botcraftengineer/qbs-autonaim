/**
 * Агент для проведения интервью
 */

import { BaseAgent } from "./base-agent";
import type { AgentResult, AgentType, BaseAgentContext } from "./types";

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
      "interviewer" as AgentType,
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
      return { success: false, error: "Invalid input" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // Здесь будет AI-вызов
      const mockResult: InterviewerOutput = {
        response: "Расскажите, пожалуйста, подробнее о вашем опыте",
        shouldRequestVoice: input.voiceMessagesCount < input.maxVoiceMessages,
        questionType: "PROFESSIONAL",
        shouldContinue: true,
      };

      return { success: true, data: mockResult, metadata: { prompt } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
