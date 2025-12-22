/**
 * Обработчик входящих сообщений с поддержкой буферизации
 * 
 * Интегрирует систему буферизации сообщений для интервью-бота.
 * Добавляет сообщения в буфер и отправляет события в Inngest для debounce.
 */

import { env } from "@qbs-autonaim/config";
import type { MessageBufferService } from "@qbs-autonaim/shared";
import { getConversationMetadata } from "@qbs-autonaim/shared";
import type { MessageData } from "../schemas/message-data.schema";
import { getCurrentInterviewStep } from "../utils/interview-helpers";

/**
 * Параметры для обработки входящего сообщения
 */
export interface HandleMessageParams {
  /** Данные сообщения от Telegram */
  messageData: MessageData;
  
  /** ID workspace */
  workspaceId: string;
  
  /** ID разговора (если кандидат идентифицирован) */
  conversationId?: string;
  
  /** ID пользователя Telegram */
  userId: string;
  
  /** Сервис буферизации сообщений */
  bufferService: MessageBufferService;
}

/**
 * Результат обработки сообщения
 */
export interface HandleMessageResult {
  /** Было ли сообщение добавлено в буфер */
  buffered: boolean;
  
  /** Причина, если сообщение не было буферизовано */
  reason?: string;
  
  /** Текущий шаг интервью */
  interviewStep?: number;
}

/**
 * Обработать входящее сообщение с буферизацией
 * 
 * Если буферизация включена и кандидат идентифицирован:
 * 1. Определяет текущий шаг интервью
 * 2. Добавляет сообщение в буфер
 * 3. Отправляет событие в Inngest для debounce
 * 
 * Если буферизация выключена или кандидат не идентифицирован:
 * - Возвращает результат с buffered: false
 * 
 * @param params - Параметры обработки сообщения
 * @returns Promise с результатом обработки
 */
export async function handleIncomingMessage(
  params: HandleMessageParams,
): Promise<HandleMessageResult> {
  const { messageData, conversationId, userId, bufferService } = params;

  // Проверяем feature flag
  const bufferEnabled = env.INTERVIEW_BUFFER_ENABLED ?? false;
  
  if (!bufferEnabled) {
    return {
      buffered: false,
      reason: "buffer disabled by feature flag",
    };
  }

  // Буферизация работает только для идентифицированных кандидатов
  if (!conversationId) {
    return {
      buffered: false,
      reason: "candidate not identified",
    };
  }

  // Определяем текущий шаг интервью
  const interviewStep = await getCurrentInterviewStep(conversationId);

  // Получаем контекст вопроса из metadata
  let questionContext: string | undefined;
  try {
    const metadata = await getConversationMetadata(conversationId);
    questionContext = metadata.lastQuestionAsked;
  } catch (error) {
    console.error("❌ Ошибка получения questionContext:", error);
  }

  // Определяем тип контента и содержимое
  let content = "";
  let contentType: "TEXT" | "VOICE" = "TEXT";

  if (messageData.text) {
    content = messageData.text;
    contentType = "TEXT";
  } else if (messageData.media?.type === "voice" || messageData.media?.type === "audio") {
    // Голосовые сообщения буферизуются после транскрипции в transcribe-voice.ts
    // Здесь пропускаем, так как контент (транскрипция) еще не готов
    return {
      buffered: false,
      reason: "voice message - buffering happens after transcription in transcribe-voice.ts",
    };
  } else {
    return {
      buffered: false,
      reason: "unsupported message type",
    };
  }

  // Добавляем сообщение в буфер
  try {
    await bufferService.addMessage({
      userId,
      conversationId,
      interviewStep,
      message: {
        id: messageData.id.toString(),
        content,
        contentType,
        timestamp: Date.now(),
        questionContext,
      },
    });

    console.log("✅ Сообщение добавлено в буфер", {
      conversationId,
      interviewStep,
      messageId: messageData.id,
      contentType,
    });
  } catch (error) {
    console.error("❌ Ошибка добавления сообщения в буфер:", error);
    return {
      buffered: false,
      reason: "buffer service error",
    };
  }

  // Отправляем событие в Inngest для debounce
  try {
    if (!env.INNGEST_EVENT_KEY) {
      console.warn("⚠️ INNGEST_EVENT_KEY не установлен, событие не отправлено");
      return {
        buffered: true,
        interviewStep,
      };
    }

    await fetch(`${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "interview/message.buffered",
        data: {
          userId,
          conversationId,
          interviewStep,
          messageId: messageData.id.toString(),
          timestamp: Date.now(),
        },
      }),
    });

    console.log("✅ Событие interview/message.buffered отправлено", {
      conversationId,
      interviewStep,
      messageId: messageData.id,
    });
  } catch (error) {
    console.error("❌ Ошибка отправки события в Inngest:", error);
    // Не возвращаем ошибку, так как сообщение уже в буфере
  }

  return {
    buffered: true,
    interviewStep,
  };
}
