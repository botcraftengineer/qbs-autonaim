/**
 * Механизм группировки сообщений от кандидата
 * 
 * Проблема: кандидат может отправить несколько голосовых/текстовых сообщений подряд,
 * а бот реагирует на каждое отдельно, создавая хаос.
 * 
 * Решение: ждем N секунд после последнего сообщения, собираем все в группу,
 * затем обрабатываем как один ответ.
 */

import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { and, desc, eq, gte } from "drizzle-orm";
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
 */
export async function shouldProcessMessageGroup(
  conversationId: string,
  currentMessageId: string,
  messageType: "TEXT" | "VOICE" = "TEXT",
): Promise<MessageGroup> {
  // Проверяем, включена ли группировка для этого типа сообщений
  const isGroupingEnabled =
    messageType === "TEXT"
      ? MESSAGE_GROUPING_CONFIG.ENABLE_TEXT_GROUPING
      : MESSAGE_GROUPING_CONFIG.ENABLE_VOICE_GROUPING;

  if (!isGroupingEnabled) {
    // Группировка отключена - обрабатываем сразу
    return {
      conversationId,
      messages: [],
      shouldProcess: true,
      reason: "grouping disabled",
    };
  }

  const now = new Date();
  const groupingWindowStart = new Date(
    now.getTime() - MESSAGE_GROUPING_CONFIG.MAX_WINDOW * 1000,
  );
  const debounceThreshold = new Date(
    now.getTime() - MESSAGE_GROUPING_CONFIG.DEBOUNCE_DELAY * 1000,
  );

  // Получаем все сообщения кандидата за последние MAX_GROUPING_WINDOW секунд
  const recentMessages = await db.query.conversationMessage.findMany({
    where: and(
      eq(conversationMessage.conversationId, conversationId),
      eq(conversationMessage.sender, "CANDIDATE"),
      gte(conversationMessage.createdAt, groupingWindowStart),
    ),
    orderBy: [desc(conversationMessage.createdAt)],
  });

  if (recentMessages.length === 0) {
    return {
      conversationId,
      messages: [],
      shouldProcess: true,
      reason: "no recent messages",
    };
  }

  // Находим текущее сообщение
  const currentMessage = recentMessages.find(
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
  const newerMessages = recentMessages.filter(
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
  const timeSinceLastMessage = now.getTime() - currentMessage.createdAt.getTime();
  const hasWaitedEnough =
    timeSinceLastMessage >= MESSAGE_GROUPING_CONFIG.DEBOUNCE_DELAY * 1000;

  if (!hasWaitedEnough) {
    // Еще не прошло достаточно времени - ждем
    return {
      conversationId,
      messages: [],
      shouldProcess: false,
      reason: `waiting for debounce (${Math.round(timeSinceLastMessage / 1000)}s / ${MESSAGE_GROUPING_CONFIG.DEBOUNCE_DELAY}s)`,
    };
  }

  // Прошло достаточно времени - собираем группу для обработки
  const groupMessages = recentMessages.map((m) => ({
    id: m.externalMessageId || m.id,
    content: m.content,
    contentType: m.contentType as "TEXT" | "VOICE",
    createdAt: m.createdAt,
  }));

  return {
    conversationId,
    messages: groupMessages,
    shouldProcess: true,
    reason: `group ready (${groupMessages.length} messages)`,
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
