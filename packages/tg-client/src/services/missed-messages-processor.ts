/**
 * Обработка пропущенных сообщений
 */

import type { TelegramClient } from "@mtcute/bun";
import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client.ws";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { createBotHandler } from "../bot-handler";

export interface MissedMessagesProcessorConfig {
  getClient: (workspaceId: string) => TelegramClient | null;
}

/**
 * Обрабатывает пропущенные сообщения для всех активных диалогов
 */
export async function processMissedMessages(
  config: MissedMessagesProcessorConfig,
): Promise<void> {
  console.log("🔍 Проверка пропущенных сообщений...");

  const conversations = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.status, "ACTIVE"));

  if (conversations.length === 0) {
    console.log("ℹ️ Нет активных бесед для проверки");
    return;
  }

  console.log(`📋 Найдено ${conversations.length} активных бесед`);

  let processedCount = 0;
  let errorCount = 0;

  for (const conversation of conversations) {
    try {
      const result = await processConversationMissedMessages(
        conversation,
        config.getClient,
      );
      processedCount += result.processed;
      errorCount += result.errors;
    } catch (error) {
      console.error(`❌ Ошибка проверки беседы ${conversation.chatId}:`, error);
      errorCount++;
    }
  }

  console.log(
    `✅ Обработка пропущенных сообщений завершена: обработано ${processedCount}, ошибок ${errorCount}`,
  );
}

/**
 * Обрабатывает пропущенные сообщения для одной беседы
 */
async function processConversationMissedMessages(
  conversation: typeof telegramConversation.$inferSelect,
  getClient: (workspaceId: string) => TelegramClient | null,
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Получаем последнее сообщение из БД
  const lastMessage = await db
    .select()
    .from(telegramMessage)
    .where(eq(telegramMessage.conversationId, conversation.id))
    .orderBy(desc(telegramMessage.createdAt))
    .limit(1);

  const lastMessageDate = lastMessage[0]?.createdAt;

  // Получаем workspace
  if (!conversation.responseId) {
    return { processed, errors };
  }

  const response = await db.query.vacancyResponse.findFirst({
    where: eq(vacancyResponse.id, conversation.responseId),
    with: {
      vacancy: true,
    },
  });

  if (!response?.vacancy?.workspaceId) {
    return { processed, errors };
  }

  const client = getClient(response.vacancy.workspaceId);
  if (!client) {
    console.log(
      `⚠️ Клиент не найден для workspace ${response.vacancy.workspaceId}`,
    );
    return { processed, errors };
  }

  const messageHandler = createBotHandler(client, response.vacancy.workspaceId);

  // Получаем историю из Telegram
  const chatIdNumber = Number.parseInt(conversation.chatId, 10);
  if (Number.isNaN(chatIdNumber)) {
    console.log(
      `⚠️ Некорректный chatId для беседы ${conversation.id}: ${conversation.chatId}`,
    );
    return { processed, errors };
  }

  const messages: Array<{
    id: number;
    text?: string;
    date: Date;
    isOutgoing: boolean;
  }> = [];

  try {
    for await (const msg of client.iterHistory(chatIdNumber, { limit: 20 })) {
      messages.push({
        id: msg.id,
        text: msg.text,
        date: msg.date,
        isOutgoing: msg.isOutgoing,
      });
    }
  } catch (historyError) {
    const errorMessage =
      historyError instanceof Error
        ? historyError.message
        : String(historyError);

    if (
      errorMessage.includes("not found in local cache") ||
      errorMessage.includes("PEER_ID_INVALID") ||
      errorMessage.includes("CHANNEL_INVALID")
    ) {
      console.log(`⚠️ Чат ${conversation.chatId} не найден в кэше, пропускаем`);
      return { processed, errors };
    }
    throw historyError;
  }

  // Фильтруем пропущенные входящие сообщения
  const missedMessages = messages.filter((msg) => {
    if (msg.isOutgoing) return false;
    if (!lastMessageDate) return true;
    return msg.date > lastMessageDate;
  });

  if (missedMessages.length > 0) {
    console.log(
      `📨 Найдено ${missedMessages.length} пропущенных сообщений в чате ${conversation.chatId}`,
    );

    for (const msg of missedMessages.reverse()) {
      try {
        const fullMessage = await client.getMessages(chatIdNumber, [msg.id]);
        if (fullMessage[0]) {
          await messageHandler(fullMessage[0]);
          processed++;
        }
      } catch (msgError) {
        console.error(`❌ Ошибка обработки сообщения ${msg.id}:`, msgError);
        errors++;
      }
    }
  }

  return { processed, errors };
}
