/**
 * Улучшенный агент интервьюера с AI SDK
 */

import type { AIPoweredAgentConfig } from "./ai-powered-agent";
import { AIPoweredAgent } from "./ai-powered-agent";
import { getConversationContext, getVoiceMessagesInfo } from "./tools";
import { type AgentResult, AgentType, type BaseAgentContext } from "./types";

export interface EnhancedInterviewerInput {
  message: string;
  voiceMessagesCount: number;
  maxVoiceMessages: number;
  questionsAsked: number;
  customQuestions?: string | null;
}

export interface EnhancedInterviewerOutput {
  response: string;
  shouldRequestVoice: boolean;
  questionType?: "ORGANIZATIONAL" | "PROFESSIONAL" | "CLARIFICATION";
  shouldContinue: boolean;
  confidence: number;
  detectedTopics: string[];
  sentiment: string;
}

export class EnhancedInterviewerAgent extends AIPoweredAgent<
  EnhancedInterviewerInput,
  EnhancedInterviewerOutput
> {
  constructor(config: AIPoweredAgentConfig) {
    super(
      "EnhancedInterviewer",
      AgentType.INTERVIEWER,
      "Ты — опытный рекрутер, проводящий интервью через Telegram.",
      config,
    );
  }

  protected validate(input: EnhancedInterviewerInput): boolean {
    if (!input.message) return false;

    if (
      !Number.isFinite(input.voiceMessagesCount) ||
      input.voiceMessagesCount < 0
    )
      return false;
    if (!Number.isFinite(input.maxVoiceMessages) || input.maxVoiceMessages < 0)
      return false;
    if (!Number.isFinite(input.questionsAsked) || input.questionsAsked < 0)
      return false;

    return true;
  }

  protected buildPrompt(
    input: EnhancedInterviewerInput,
    context: BaseAgentContext,
  ): string {
    const hasEnoughVoices = input.voiceMessagesCount >= input.maxVoiceMessages;
    const needsFirstVoice = input.voiceMessagesCount === 0;

    let voiceStrategy = "";
    if (needsFirstVoice) {
      voiceStrategy =
        "Попроси записать первое голосовое про организационные вопросы";
    } else if (!hasEnoughVoices) {
      voiceStrategy = "Попроси рассказать про профессиональный опыт голосом";
    } else {
      voiceStrategy = "Все голосовые получены, работай текстом";
    }

    return `${this.systemPrompt}

СТРАТЕГИЯ: ${voiceStrategy}

ИСТОРИЯ:
${context.conversationHistory
  .slice(-5)
  .map((m) => `${m.sender}: ${m.content}`)
  .join("\n")}

СООБЩЕНИЕ: "${input.message}"

ПРАВИЛА:
- Обращайся на "вы"
- "Добрый день", НЕ "Привет"
- 1-2 предложения
- Без шаблонов

Верни JSON:
{
  "response": "текст",
  "shouldRequestVoice": true/false,
  "questionType": "ORGANIZATIONAL"|"PROFESSIONAL"|"CLARIFICATION"|null,
  "shouldContinue": true/false,
  "confidence": 0.0-1.0
}`;
  }

  async execute(
    input: EnhancedInterviewerInput,
    context: BaseAgentContext,
  ): Promise<AgentResult<EnhancedInterviewerOutput>> {
    if (!this.validate(input)) {
      return { success: false, error: "Некорректные входные данные" };
    }

    try {
      const prompt = this.buildPrompt(input, context);

      // AI-вызов с инструментами
      const aiResponse = await this.generateAIResponse(prompt, {
        getVoiceMessagesInfo,
        getConversationContext,
      });

      const expectedFormat = `{
  "response": "string",
  "shouldRequestVoice": boolean,
  "questionType": "ORGANIZATIONAL" | "PROFESSIONAL" | "CLARIFICATION" | null,
  "shouldContinue": boolean,
  "confidence": number
}`;

      const parsed = await this.parseJSONResponseWithRetry<
        Omit<EnhancedInterviewerOutput, "detectedTopics" | "sentiment">
      >(aiResponse, expectedFormat);

      if (!parsed) {
        return { success: false, error: "Не удалось разобрать ответ AI" };
      }

      const result: EnhancedInterviewerOutput = {
        ...parsed,
        detectedTopics: [],
        sentiment: "NEUTRAL",
      };

      return { success: true, data: result, metadata: { prompt } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Неизвестная ошибка",
      };
    }
  }
}
