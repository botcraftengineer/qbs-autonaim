/**
 * AI Response Generator с мультиагентной системой
 *
 * Использует новую архитектуру с специализированными агентами
 */

import { generateText, getAIModel } from "@qbs-autonaim/lib";
import {
  buildTelegramRecruiterPrompt,
  type ConversationStage,
  convertLegacyContext,
  // Мультиагентная система
  InterviewOrchestrator,
  type TelegramRecruiterContext,
} from "@qbs-autonaim/prompts";

interface GenerateResponseParams {
  messageText: string;
  stage: ConversationStage;
  candidateName?: string;
  vacancyTitle?: string;
  vacancyRequirements?: string;
  responseStatus?: string;
  conversationHistory?: Array<{
    sender: string;
    content: string;
    contentType?: "TEXT" | "VOICE";
  }>;
  resumeData?: {
    experience?: string;
    coverLetter?: string;
    phone?: string;
  };
  errorMessage?: string;
  customBotInstructions?: string | null;
  customInterviewQuestions?: string | null;
  failedPinAttempts?: number;
  screeningScore?: number;
  screeningAnalysis?: string;
  botName?: string;
  botRole?: string;
}

interface AIResponseResult {
  text: string;
  shouldEscalate?: boolean;
  escalationReason?: string;
}

/**
 * Генерирует ответ через мультиагентную систему с полными метаданными
 */
export async function generateAIResponseWithMetadata(
  params: GenerateResponseParams,
): Promise<AIResponseResult> {
  // Для этапа INTERVIEWING используем мультиагентную систему
  if (params.stage === "INTERVIEWING") {
    return await generateWithMultiAgent(params);
  }

  // Для других этапов используем старую систему
  return await generateWithLegacySystem(params);
}

/**
 * Генерирует ответ через мультиагентную систему (backward compatible)
 * @deprecated Используйте generateAIResponseWithMetadata для получения метаданных эскалации
 */
export async function generateAIResponse(
  params: GenerateResponseParams,
): Promise<string> {
  const result = await generateAIResponseWithMetadata(params);
  return result.text;
}

/**
 * Генерация через мультиагентную систему
 */
async function generateWithMultiAgent(
  params: GenerateResponseParams,
): Promise<AIResponseResult> {
  // Получаем AI модель из конфигурации
  const model = getAIModel();

  const orchestrator = new InterviewOrchestrator({
    model,
  });

  const legacyContext: TelegramRecruiterContext = {
    messageText: params.messageText,
    stage: params.stage,
    candidateName: params.candidateName,
    vacancyTitle: params.vacancyTitle,
    vacancyRequirements: params.vacancyRequirements,
    responseStatus: params.responseStatus,
    conversationHistory: params.conversationHistory || [],
    resumeData: params.resumeData,
    errorMessage: params.errorMessage,
    customBotInstructions: params.customBotInstructions,
    customInterviewQuestions: params.customInterviewQuestions,
    failedPinAttempts: params.failedPinAttempts,
    screeningScore: params.screeningScore,
    screeningAnalysis: params.screeningAnalysis,
    botName: params.botName,
    botRole: params.botRole,
  };

  const { context, state } = convertLegacyContext(legacyContext);

  try {
    const result = await orchestrator.execute(
      {
        message: params.messageText,
        currentState: state,
        failedPinAttempts: params.failedPinAttempts,
        customQuestions: params.customInterviewQuestions,
      },
      context,
    );

    // Эскалация
    if (result.decision.action === "ESCALATE") {
      return {
        text: "Передаю ваш запрос коллеге. Он свяжется с вами в ближайшее время.",
        shouldEscalate: true,
        escalationReason: result.decision.reason,
      };
    }

    // Пропуск ответа (благодарность и т.д.)
    if (result.decision.action === "SKIP") {
      return { text: "" };
    }

    return { text: result.response || "" };
  } catch (error) {
    console.error("Ошибка мультиагентной системы, fallback:", error);
    return await generateWithLegacySystem(params);
  }
}

/**
 * Fallback на старую систему для не-INTERVIEWING этапов
 */
async function generateWithLegacySystem(
  params: GenerateResponseParams,
): Promise<AIResponseResult> {
  const context: TelegramRecruiterContext = {
    messageText: params.messageText,
    stage: params.stage,
    candidateName: params.candidateName,
    vacancyTitle: params.vacancyTitle,
    vacancyRequirements: params.vacancyRequirements,
    responseStatus: params.responseStatus,
    conversationHistory: params.conversationHistory || [],
    resumeData: params.resumeData,
    errorMessage: params.errorMessage,
    customBotInstructions: params.customBotInstructions,
    customInterviewQuestions: params.customInterviewQuestions,
    botName: params.botName,
    botRole: params.botRole,
  };

  const prompt = buildTelegramRecruiterPrompt(context);

  try {
    const { text } = await generateText({
      prompt,
      generationName: "telegram-response",
      entityId: "telegram-chat",
      metadata: {
        messageText: params.messageText,
        candidateName: params.candidateName,
        stage: params.stage,
      },
    });

    return { text: text.trim() };
  } catch (error) {
    console.error("Ошибка генерации AI ответа:", error);
    throw error;
  }
}
