/**
 * Обработка пропущенных сообщений
 *
 * Этот модуль обрабатывает сообщения, которые могли быть пропущены во время
 * отключения бота. Работает в связке с catchUp: true в TelegramClient,
 * который автоматически получает пропущенные обновления через MTProto.
 *
 * Процессор дополнительно проверяет историю активных диалогов и обрабатывает
 * входящие сообщения, которые появились после последнего сохраненного в БД.
 *
 * Важно: Использует iterDialogs() для итерации по всем диалогам и получения
 * access hash нужного чата перед обращением к его истории. Это решает проблему
 * PEER_ID_INVALID при первом запуске, когда клиент еще не "встретил" пользователя
 * в текущей сессии и не имеет необходимых данных для прямого обращения к чату.
 */

import type { TelegramClient } from "@mtcute/bun";
import { and, desc, eq, or } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  conversation,
  conversationMessage,
  gig,
  response,
  vacancy,
} from "@qbs-autonaim/db/schema";
import type { MessageData } from "../schemas/message-data.schema";
import { messageDataSchema } from "../schemas/message-data.schema";
import {
  getFloodWaitSeconds,
  isFloodWaitError,
  sleep,
} from "../utils/flood-wait";
import { triggerIncomingMessage } from "../utils/inngest";

export interface MissedMessagesProcessorConfig {
  getClient: (workspaceId: string) => TelegramClient | null;
}

type ConversationWithChatId = {
  id: string;
  responseId: string;
  candidateName: string | null;
  username: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  chatId: string | null;
  workspaceId: string;
  entityType: "gig" | "vacancy" | "project";
};

function buildMessageData(message: {
  id: number;
  chat: { id: { toString: () => string } };
  text: string;
  isOutgoing: boolean;
  media?: {
    type: string;
    fileId?: unknown;
    mimeType?: unknown;
    duration?: unknown;
  } | null;
  sender?: {
    type: string;
    username?: unknown;
    firstName?: unknown;
  } | null;
}): MessageData {
  return {
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
}

/**
 * Обрабатывает пропущенные сообщения для всех активных диалогов
 */
export async function processMissedMessages(
  config: MissedMessagesProcessorConfig,
): Promise<void> {
  const startTime = Date.now();
  console.log("🔍 Проверка пропущенных сообщений...");

  // Get active conversations with their chatId and workspaceId
  // We need to join with both gig and vacancy tables to get workspaceId
  const gigConversations = await db
    .select({
      id: conversation.id,
      responseId: conversation.responseId,
      candidateName: conversation.candidateName,
      username: conversation.username,
      status: conversation.status,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      chatId: response.chatId,
      workspaceId: gig.workspaceId,
      entityType: response.entityType,
    })
    .from(conversation)
    .innerJoin(response, eq(conversation.responseId, response.id))
    .innerJoin(
      gig,
      and(eq(response.entityType, "gig"), eq(response.entityId, gig.id)),
    )
    .where(eq(conversation.status, "ACTIVE"));

  const vacancyConversations = await db
    .select({
      id: conversation.id,
      responseId: conversation.responseId,
      candidateName: conversation.candidateName,
      username: conversation.username,
      status: conversation.status,
      metadata: conversation.metadata,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      chatId: response.chatId,
      workspaceId: vacancy.workspaceId,
      entityType: response.entityType,
    })
    .from(conversation)
    .innerJoin(response, eq(conversation.responseId, response.id))
    .innerJoin(
      vacancy,
      and(
        eq(response.entityType, "vacancy"),
        eq(response.entityId, vacancy.id),
      ),
    )
    .where(eq(conversation.status, "ACTIVE"));

  const conversations = [...gigConversations, ...vacancyConversations];

  if (conversations.length === 0) {
    console.log("ℹ️ Нет активных бесед для проверки");
    return;
  }

  console.log(`📋 Найдено ${conversations.length} активных бесед`);

  let processedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const conversation of conversations) {
    // Пропускаем беседы без responseId или chatId
    if (!conversation.responseId || !conversation.chatId) {
      skippedCount++;
      continue;
    }

    try {
      const result = await processConversationMissedMessages(
        conversation as ConversationWithChatId,
        config.getClient,
      );
      processedCount += result.processed;
      errorCount += result.errors;
      if (result.processed === 0 && result.errors === 0) {
        skippedCount++;
      }

      // Добавляем небольшую задержку между обработкой бесед
      // чтобы избежать FLOOD_WAIT
      await sleep(1000);
    } catch (error) {
      // Обработка FLOOD_WAIT ошибки
      if (isFloodWaitError(error)) {
        const waitSeconds = getFloodWaitSeconds(error);
        console.warn(
          `⏳ FLOOD_WAIT: ожидание ${waitSeconds} секунд перед продолжением...`,
        );
        await sleep(waitSeconds * 1000);
        // Повторная попытка после ожидания
        try {
          const result = await processConversationMissedMessages(
            conversation as ConversationWithChatId,
            config.getClient,
          );
          processedCount += result.processed;
          errorCount += result.errors;
          if (result.processed === 0 && result.errors === 0) {
            skippedCount++;
          }
        } catch (retryError) {
          console.error(
            `❌ Ошибка проверки беседы ${conversation.chatId} после повтора:`,
            retryError,
          );
          errorCount++;
        }
      } else {
        console.error(
          `❌ Ошибка проверки беседы ${conversation.chatId}:`,
          error,
        );
        errorCount++;
      }
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
  conversation: ConversationWithChatId,
  getClient: (workspaceId: string) => TelegramClient | null,
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Получаем последнее сообщение из БД
  const lastMessage = await db
    .select()
    .from(conversationMessage)
    .where(eq(conversationMessage.conversationId, conversation.id))
    .orderBy(desc(conversationMessage.createdAt))
    .limit(1);

  const lastMessageDate = lastMessage[0]?.createdAt;

  // Get client using workspaceId from conversation
  const client = getClient(conversation.workspaceId);
  if (!client) {
    console.log(`⚠️ Клиент не найден для workspace ${conversation.workspaceId}`);
    return { processed, errors };
  }

  // Получаем историю из Telegram
  if (!conversation.chatId) {
    console.log(`⚠️ Отсутствует chatId для беседы ${conversation.id}`);
    return { processed, errors };
  }

  const chatIdNumber = Number.parseInt(conversation.chatId, 10);
  if (Number.isNaN(chatIdNumber)) {
    console.log(
      `⚠️ Некорректный chatId для беседы ${conversation.id}: ${conversation.chatId}`,
    );
    return { processed, errors };
  }

  // Используем findDialogs для получения access hash
  // Это позволяет избежать PEER_ID_INVALID при первом запуске
  const messages: Array<{
    id: number;
    text?: string;
    date: Date;
    isOutgoing: boolean;
  }> = [];

  try {
    // Ищем диалог среди всех диалогов клиента
    let dialogFound = false;

    for await (const dialog of client.iterDialogs()) {
      if (dialog.peer.id.toString() === conversation.chatId) {
        dialogFound = true;

        // Теперь у нас есть access hash, можем получить историю
        const history = await client.getHistory(dialog.peer.id, { limit: 20 });

        for await (const msg of history) {
          messages.push({
            id: msg.id,
            text: msg.text,
            date: msg.date,
            isOutgoing: msg.isOutgoing,
          });
        }
        break;
      }
    }

    if (!dialogFound) {
      console.log(
        `⚠️ Диалог ${conversation.chatId} не найден среди активных диалогов`,
      );
      return { processed, errors };
    }
  } catch (historyError) {
    // Обработка FLOOD_WAIT
    if (isFloodWaitError(historyError)) {
      const waitSeconds = getFloodWaitSeconds(historyError);
      console.warn(
        `⏳ FLOOD_WAIT для чата ${conversation.chatId}: ожидание ${waitSeconds} секунд...`,
      );
      await sleep(waitSeconds * 1000);
      // Очищаем массив перед повторной попыткой, чтобы избежать дублирования
      messages.length = 0;
      // Повторная попытка после ожидания
      try {
        let dialogFound = false;
        for await (const dialog of client.iterDialogs()) {
          if (dialog.peer.id.toString() === conversation.chatId) {
            dialogFound = true;
            const history = await client.getHistory(dialog.peer.id, {
              limit: 20,
            });
            for await (const msg of history) {
              messages.push({
                id: msg.id,
                text: msg.text,
                date: msg.date,
                isOutgoing: msg.isOutgoing,
              });
            }
            break;
          }
        }
        if (!dialogFound) {
          console.log(
            `⚠️ Диалог ${conversation.chatId} не найден среди активных диалогов`,
          );
          return { processed, errors };
        }
      } catch (retryError) {
        console.error(
          `❌ Ошибка получения истории чата ${conversation.chatId} после повтора:`,
          retryError,
        );
        errors++;
        return { processed, errors };
      }
    } else {
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
        console.log(
          `⚠️ Чат ${conversation.chatId} недоступен или не существует`,
        );
        return { processed, errors };
      }
      throw historyError;
    }
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
          const messageDataRaw = buildMessageData(message);

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
            conversation.workspaceId,
            validationResult.data,
          );
          processed++;
        }
      } catch (msgError) {
        // Обработка FLOOD_WAIT для отдельных сообщений
        if (isFloodWaitError(msgError)) {
          const waitSeconds = getFloodWaitSeconds(msgError);
          console.warn(
            `⏳ FLOOD_WAIT для сообщения ${msg.id}: ожидание ${waitSeconds} секунд...`,
          );
          await sleep(waitSeconds * 1000);
          // Повторная попытка
          try {
            const fullMessage = await client.getMessages(chatIdNumber, [
              msg.id,
            ]);
            if (fullMessage[0]) {
              const message = fullMessage[0];
              const messageDataRaw = buildMessageData(message);

              const validationResult =
                messageDataSchema.safeParse(messageDataRaw);
              if (!validationResult.success) {
                console.error(
                  `❌ Ошибка валидации данных сообщения ${msg.id}:`,
                  validationResult.error.format(),
                );
                errors++;
                continue;
              }
              await triggerIncomingMessage(
                conversation.workspaceId,
                validationResult.data,
              );
              processed++;
            }
          } catch (retryError) {
            console.error(
              `❌ Ошибка обработки сообщения ${msg.id} после повтора:`,
              retryError,
            );
            errors++;
          }
        } else {
          console.error(`❌ Ошибка обработки сообщения ${msg.id}:`, msgError);
          errors++;
        }
      }
    }
  }

  return { processed, errors };
}
