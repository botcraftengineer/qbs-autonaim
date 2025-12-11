/**
 * AI Response Generator для Telegram-бота рекрутера
 *
 * ИСПОЛЬЗОВАНИЕ:
 * - text-message.ts: проверяет наличие conversation → AWAITING_PIN или INTERVIEWING
 * - unidentified-message.ts: обрабатывает PIN → создает conversation → PIN_RECEIVED
 */

import { generateText } from "@qbs-autonaim/lib";
import {
  buildTelegramRecruiterPrompt,
  type ConversationStage,
  type TelegramRecruiterContext,
} from "@qbs-autonaim/prompts";

interface GenerateResponseParams {
  messageText: string;
  stage: ConversationStage;
  candidateName?: string;
  vacancyTitle?: string;
  responseStatus?: string;
  conversationHistory?: Array<{ sender: string; content: string }>;
  resumeData?: {
    experience?: string;
    coverLetter?: string;
    phone?: string;
  };
  errorMessage?: string;
}

/**
 * Генерирует ответ через AI, имитируя живого рекрутера
 * Работает в 3 этапа:
 * 1. AWAITING_PIN - запрашивает PIN-код для идентификации
 * 2. PIN_RECEIVED - приветствует и начинает интервью
 * 3. INTERVIEWING - проводит интервью, задает вопросы
 */
export async function generateAIResponse(
  params: GenerateResponseParams,
): Promise<string> {
  const context: TelegramRecruiterContext = {
    messageText: params.messageText,
    stage: params.stage,
    candidateName: params.candidateName,
    vacancyTitle: params.vacancyTitle,
    responseStatus: params.responseStatus,
    conversationHistory: params.conversationHistory || [],
    resumeData: params.resumeData,
    errorMessage: params.errorMessage,
  };

  const prompt = buildTelegramRecruiterPrompt(context);

  try {
    const { text } = await generateText({
      prompt,
      temperature: 0.7,
      generationName: "telegram-response",
      entityId: "telegram-chat",
      metadata: {
        messageText: params.messageText,
        candidateName: params.candidateName,
        stage: params.stage,
      },
    });

    return text.trim();
  } catch (error) {
    console.error("Ошибка генерации AI ответа:", error);
    return "Извини, что-то пошло не так. Можешь повторить?";
  }
}
