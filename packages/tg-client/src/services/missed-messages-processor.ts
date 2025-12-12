/**
 * Обработка пропущенных сообщений
 *
 * Этот модуль обрабатывает сообщения, которые могли быть пропущены во время
 * отключения бота. Работает в связке с catchUp: true в TelegramClient,
 * который автоматически получает пропущенные обновления через MTProto.
 *
 * Процессор дополнительно проверяет историю активных диалогов и обрабатывает
 * входящие сообщения, которые появились после последнего сохраненного в БД.
 */

import type { TelegramClient } from "@mtcute/bun";
import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import type { MessageData } from "../schemas/message-data.schema";
import { messageDataSchema } from "../schemas/message-data.schema";
import { triggerIncomingMessage } from "../utils/inngest";

export interface MissedMessagesProcessorConfig {
  getClient: (workspaceId: string) => TelegramClient | null;
}

/**
 * Обрабатывает пропущенные сообщения для всех активных диалогов
 */
export async function processMissedMessages(
  config: MissedMessagesProcessorConfig,
): Promise<void> {
  const startTime = Date.now();
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
  let skippedCount = 0;

  for (const conversation of conversations) {
    try {
      const result = await processConversationMissedMessages(
        conversation,
        config.getClient,
      );
      processedCount += result.processed;
      errorCount += result.errors;
      if (result.processed === 0 && result.errors === 0) {
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Ошибка проверки беседы ${conversation.chatId}:`, error);
      errorCount++;
    }
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `✅ Обработка пропущенных сообщений завершена за ${duration}s: обработано ${processedCount}, пропущено ${skippedCount}, ошибок ${errorCount}`,
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

  // Получаем историю из Telegram
  const chatIdNumber = Number.parseInt(conversation.chatId, 10);
  if (Number.isNaN(chatIdNumber)) {
    console.log(
      `⚠️ Некорректный chatId для беседы ${conversation.id}: ${conversation.chatId}`,
    );
    return { processed, errors };
  }

  // Вместо iterHistory используем прямой запрос getHistory
  // Это не требует кэша и работает сразу после подключения
  const messages: Array<{
    id: number;
    text?: string;
    date: Date;
    isOutgoing: boolean;
  }> = [];

  try {
    // Получаем последние 20 сообщений напрямую через API
    const history = await client.getHistory(chatIdNumber, { limit: 20 });

    // getHistory возвращает итератор, преобразуем в массив
    for await (const msg of history) {
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

    // Если чат не найден или недоступен, пропускаем
    if (
      errorMessage.includes("PEER_ID_INVALID") ||
      errorMessage.includes("CHANNEL_INVALID") ||
      errorMessage.includes("CHAT_INVALID") ||
      errorMessage.includes("USER_INVALID")
    ) {
      console.log(`⚠️ Чат ${conversation.chatId} недоступен или не существует`);
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
          const message = fullMessage[0];

          // Конструируем данные сообщения с проверкой типов
          const messageDataRaw: MessageData = {
            id: message.id,
            chatId: message.chat.id.toString(),
            text: message.text,
            isOutgoing: message.isOutgoing,
            media: message.media
              ? {
                  type: message.media.type,
                  fileId:
                    "fileId" in message.media &&
                    typeof message.media.fileId === "string"
                      ? message.media.fileId
                      : undefined,
                  mimeType:
                    "mimeType" in message.media &&
                    typeof message.media.mimeType === "string"
                      ? message.media.mimeType
                      : undefined,
                  duration:
                    "duration" in message.media &&
                    typeof message.media.duration === "number"
                      ? message.media.duration
                      : undefined,
                }
              : undefined,
            sender: message.sender
              ? {
                  type: message.sender.type,
                  username:
                    "username" in message.sender &&
                    typeof message.sender.username === "string"
                      ? message.sender.username
                      : undefined,
                  firstName:
                    message.sender.type === "user" &&
                    "firstName" in message.sender &&
                    typeof message.sender.firstName === "string"
                      ? message.sender.firstName
                      : undefined,
                }
              : undefined,
          };

          // Валидируем данные перед отправкой
          const validationResult = messageDataSchema.safeParse(messageDataRaw);
          if (!validationResult.success) {
            console.error(
              `❌ Ошибка валидации данных сообщения ${msg.id}:`,
              validationResult.error.format(),
            );
            errors++;
            continue;
          }

          await triggerIncomingMessage(
            response.vacancy.workspaceId,
            validationResult.data,
          );
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
