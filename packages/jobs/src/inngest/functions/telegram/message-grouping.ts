/**
 * Механизм группировки сообщений от кандидата
 * 
 * Проблема: кандидат может отправить несколько сообщений подряд (текст/голос в любом порядке),
 * а бот реагирует на каждое отдельно, создавая хаос.
 * 
 * Решение: Группируем все сообщения кандидата с момента последнего ответа бота.
 * Ждем N секунд после последнего сообщения кандидата, затем обрабатываем всю группу.
 */

import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { MESSAGE_GROUPING_CONFIG } from "./message-grouping.config";

interface MessageGroup {
  conversationId: string;
  messages: Array<{
    id: string;
    content: string;
    contentType: "TEXT" | "VOICE";
    createdAt: Date;
  }>;
  shouldProcess: boolean;
  reason?: string;
}

/**
 * Проверяет, нужно ли ждать еще сообщений или можно обрабатывать группу
 * 
 * Умная группировка: собираем все сообщения кандидата с момента последнего ответа бота
 * Учитывает контекст интервью - если кандидат отвечает на вопрос, ждем дольше
 */
export async function shouldProcessMessageGroup(
  conversationId: string,
  currentMessageId: string,
): Promise<MessageGroup> {
  // Проверяем, включена ли группировка
  if (!MESSAGE_GROUPING_CONFIG.ENABLE_GROUPING) {
    return {
      conversationId,
      messages: [],
      shouldProcess: true,
      reason: "grouping disabled",
    };
  }

  const now = new Date();

  // Получаем последнее сообщение от бота
  const lastBotMessage = await db.query.conversationMessage.findFirst({
    where: and(
      eq(conversationMessage.conversationId, conversationId),
      eq(conversationMessage.sender, "BOT"),
    ),
    orderBy: [desc(conversationMessage.createdAt)],
  });

  // Определяем начало группировки: либо после последнего ответа бота, либо начало диалога
  const groupingStartTime = lastBotMessage?.createdAt || new Date(0);

  // Получаем все сообщения кандидата после последнего ответа бота
  const candidateMessages = await db.query.conversationMessage.findMany({
    where: and(
      eq(conversationMessage.conversationId, conversationId),
      eq(conversationMessage.sender, "CANDIDATE"),
    ),
    orderBy: [desc(conversationMessage.createdAt)],
  });

  // Фильтруем только сообщения после последнего ответа бота
  const messagesAfterBot = candidateMessages.filter(
    (m) => m.createdAt > groupingStartTime,
  );

  if (messagesAfterBot.length === 0) {
    return {
      conversationId,
      messages: [],
      shouldProcess: true,
      reason: "no messages after bot response",
    };
  }

  // Находим текущее сообщение
  const currentMessage = messagesAfterBot.find(
    (m) => m.externalMessageId === currentMessageId,
  );

  if (!currentMessage) {
    return {
      conversationId,
      messages: [],
      shouldProcess: true,
      reason: "current message not found",
    };
  }

  // Проверяем, есть ли сообщения ПОСЛЕ текущего (более новые)
  const newerMessages = messagesAfterBot.filter(
    (m) => m.createdAt > currentMessage.createdAt,
  );

  if (newerMessages.length > 0) {
    // Есть более новые сообщения - текущее уже не последнее, пропускаем
    return {
      conversationId,
      messages: [],
      shouldProcess: false,
      reason: "newer messages exist",
    };
  }

  // Текущее сообщение - последнее. Проверяем, прошло ли достаточно времени
  const timeSinceLastMessage =
    now.getTime() - currentMessage.createdAt.getTime();
  
  // Определяем нужное время ожидания на основе типа сообщений
  // Если есть голосовые - ждем дольше (кандидат может записывать несколько частей)
  const hasVoiceMessages = messagesAfterBot.some(m => m.contentType === "VOICE");
  const requiredDelay = hasVoiceMessages 
    ? MESSAGE_GROUPING_CONFIG.DEBOUNCE_DELAY_VOICE 
    : MESSAGE_GROUPING_CONFIG.DEBOUNCE_DELAY_TEXT;
  
  const hasWaitedEnough = timeSinceLastMessage >= requiredDelay * 1000;

  if (!hasWaitedEnough) {
    // Еще не прошло достаточно времени - ждем
    return {
      conversationId,
      messages: [],
      shouldProcess: false,
      reason: `waiting for debounce (${Math.round(timeSinceLastMessage / 1000)}s / ${requiredDelay}s)${hasVoiceMessages ? " [voice]" : " [text]"}`,
    };
  }

  // Прошло достаточно времени после последнего сообщения
  // Финальная проверка: убедимся что это действительно последнее сообщение
  // (могли прийти новые пока мы ждали)
  const finalCheck = await db.query.conversationMessage.findFirst({
    where: and(
      eq(conversationMessage.conversationId, conversationId),
      eq(conversationMessage.sender, "CANDIDATE"),
    ),
    orderBy: [desc(conversationMessage.createdAt)],
  });

  if (
    finalCheck &&
    finalCheck.externalMessageId !== currentMessageId &&
    finalCheck.createdAt > currentMessage.createdAt
  ) {
    // Пришло новое сообщение - текущее уже не последнее
    return {
      conversationId,
      messages: [],
      shouldProcess: false,
      reason: "newer message arrived during wait",
    };
  }

  // Все проверки времени пройдены
  // Дополнительная проверка: есть ли голосовые БЕЗ транскрипции в группе?
  // Если есть - нужно ждать пока они будут транскрибированы
  const voiceMessagesWithoutTranscription = messagesAfterBot.filter(
    (m) => m.contentType === "VOICE" && !m.voiceTranscription,
  );

  if (voiceMessagesWithoutTranscription.length > 0) {
    // Есть голосовые без транскрипции - ждём их обработки
    return {
      conversationId,
      messages: [],
      shouldProcess: false,
      reason: `waiting for voice transcription (${voiceMessagesWithoutTranscription.length} pending)`,
    };
  }

  // Все проверки пройдены - собираем ВСЮ группу после последнего ответа бота
  // Для голосовых используем транскрипцию вместо placeholder-контента
  const groupMessages = messagesAfterBot
    .reverse() // Сортируем по возрастанию (от старых к новым)
    .map((m) => ({
      id: m.externalMessageId || m.id,
      content: m.contentType === "VOICE" && m.voiceTranscription 
        ? m.voiceTranscription 
        : m.content,
      contentType: m.contentType as "TEXT" | "VOICE",
      createdAt: m.createdAt,
    }));

  return {
    conversationId,
    messages: groupMessages,
    shouldProcess: true,
    reason: `group ready (${groupMessages.length} messages since last bot response)`,
  };
}

/**
 * Форматирует группу сообщений для передачи в AI
 */
export function formatMessageGroup(
  messages: Array<{
    id: string;
    content: string;
    contentType: "TEXT" | "VOICE";
    createdAt: Date | string;
  }>,
): string {
  if (messages.length === 0) return "";
  if (messages.length === 1) return messages[0]?.content || "";

  // Несколько сообщений - объединяем с указанием типа
  return messages
    .map((m, idx) => {
      const prefix = m.contentType === "VOICE" ? "🎤 Голосовое" : "💬 Текст";
      return `${prefix} ${idx + 1}: ${m.content}`;
    })
    .join("\n\n");
}
