/**
 * Обработка пропущенных сообщений
 *
 * Этот модуль обрабатывает сообщения, которые могли быть пропущены во время
 * отключения бота. Работает в связке с catchUp: true в TelegramClient,
 * который автоматически получает пропущенные обновления через MTProto.
 */

import type { TelegramClient } from "@mtcute/bun";
import { and, desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  gig,
  gigResponse,
  interviewMessage,
  interviewSession,
  vacancy,
  vacancyResponse,
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

type InterviewSessionWithChatId = {
  id: string;
  entityType: "vacancy_response" | "gig_response";
  status: "pending" | "active" | "completed" | "cancelled" | "paused";
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  chatId: string | null;
  workspaceId: string;
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
 * Обрабатывает пропущенные сообщения для всех активных интервью
 */
export async function processMissedMessages(
  config: MissedMessagesProcessorConfig,
): Promise<void> {
  const startTime = Date.now();
  console.log("🔍 Проверка пропущенных сообщений...");

  // Get active interview sessions for gig_response with their chatId and workspaceId
  const gigSessions = await db
    .select({
      id: interviewSession.id,
      entityType: interviewSession.entityType,
      status: interviewSession.status,
      metadata: interviewSession.metadata,
      createdAt: interviewSession.createdAt,
      chatId: gigResponse.chatId,
      workspaceId: gig.workspaceId,
    })
    .from(interviewSession)
    .innerJoin(gigResponse, eq(interviewSession.gigResponseId, gigResponse.id))
    .innerJoin(gig, eq(gigResponse.gigId, gig.id))
    .where(
      and(
        eq(interviewSession.entityType, "gig_response"),
        eq(interviewSession.status, "active"),
      ),
    );

  // Get active interview sessions for vacancy_response
  const vacancySessions = await db
    .select({
      id: interviewSession.id,
      entityType: interviewSession.entityType,
      status: interviewSession.status,
      metadata: interviewSession.metadata,
      createdAt: interviewSession.createdAt,
      chatId: vacancyResponse.chatId,
      workspaceId: vacancy.workspaceId,
    })
    .from(interviewSession)
    .innerJoin(
      vacancyResponse,
      eq(interviewSession.vacancyResponseId, vacancyResponse.id),
    )
    .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
    .where(
      and(
        eq(interviewSession.entityType, "vacancy_response"),
        eq(interviewSession.status, "active"),
      ),
    );

  const sessions = [...gigSessions, ...vacancySessions];

  if (sessions.length === 0) {
    console.log("ℹ️ Нет активных сессий интервью для проверки");
    return;
  }

  console.log(`📋 Найдено ${sessions.length} активных сессий интервью`);

  let processedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const session of sessions) {
    // Пропускаем сессии без chatId
    if (!session.chatId) {
      skippedCount++;
      continue;
    }

    try {
      const result = await processSessionMissedMessages(
        session as InterviewSessionWithChatId,
        config.getClient,
      );
      processedCount += result.processed;
      errorCount += result.errors;
      if (result.processed === 0 && result.errors === 0) {
        skippedCount++;
      }

      // Добавляем небольшую задержку между обработкой сессий
      await sleep(1000);
    } catch (error) {
      if (isFloodWaitError(error)) {
        const waitSeconds = getFloodWaitSeconds(error);
        console.warn(
          `⏳ FLOOD_WAIT: ожидание ${waitSeconds} секунд перед продолжением...`,
        );
        await sleep(waitSeconds * 1000);
        try {
          const result = await processSessionMissedMessages(
            session as InterviewSessionWithChatId,
            config.getClient,
          );
          processedCount += result.processed;
          errorCount += result.errors;
        } catch (retryError) {
          console.error(
            `❌ Ошибка проверки сессии ${session.chatId} после повтора:`,
            retryError,
          );
          errorCount++;
        }
      } else {
        console.error(`❌ Ошибка проверки сессии ${session.chatId}:`, error);
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
 * Обрабатывает пропущенные сообщения для одной сессии интервью
 */
async function processSessionMissedMessages(
  session: InterviewSessionWithChatId,
  getClient: (workspaceId: string) => TelegramClient | null,
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  // Получаем последнее сообщение из БД
  const lastMessage = await db
    .select()
    .from(interviewMessage)
    .where(eq(interviewMessage.sessionId, session.id))
    .orderBy(desc(interviewMessage.createdAt))
    .limit(1);

  const lastMessageDate = lastMessage[0]?.createdAt;

  const client = getClient(session.workspaceId);
  if (!client) {
    console.log(`⚠️ Клиент не найден для workspace ${session.workspaceId}`);
    return { processed, errors };
  }

  if (!session.chatId) {
    console.log(`⚠️ Отсутствует chatId для сессии ${session.id}`);
    return { processed, errors };
  }

  const chatIdNumber = Number.parseInt(session.chatId, 10);
  if (Number.isNaN(chatIdNumber)) {
    console.log(
      `⚠️ Некорректный chatId для сессии ${session.id}: ${session.chatId}`,
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
    let dialogFound = false;

    for await (const dialog of client.iterDialogs()) {
      if (dialog.peer.id.toString() === session.chatId) {
        dialogFound = true;

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
        `⚠️ Диалог ${session.chatId} не найден среди активных диалогов`,
      );
      return { processed, errors };
    }
  } catch (historyError) {
    if (isFloodWaitError(historyError)) {
      const waitSeconds = getFloodWaitSeconds(historyError);
      console.warn(
        `⏳ FLOOD_WAIT для чата ${session.chatId}: ожидание ${waitSeconds} секунд...`,
      );
      await sleep(waitSeconds * 1000);
      messages.length = 0;
      try {
        let dialogFound = false;
        for await (const dialog of client.iterDialogs()) {
          if (dialog.peer.id.toString() === session.chatId) {
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
          return { processed, errors };
        }
      } catch (retryError) {
        console.error(
          `❌ Ошибка получения истории чата ${session.chatId} после повтора:`,
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

      if (
        errorMessage.includes("PEER_ID_INVALID") ||
        errorMessage.includes("CHANNEL_INVALID") ||
        errorMessage.includes("CHAT_INVALID") ||
        errorMessage.includes("USER_INVALID")
      ) {
        console.log(`⚠️ Чат ${session.chatId} недоступен или не существует`);
        return { processed, errors };
      }
      throw historyError;
    }
  }

  const missedMessages = messages.filter((msg) => {
    if (msg.isOutgoing) return false;
    if (!lastMessageDate) return true;
    return msg.date > lastMessageDate;
  });

  if (missedMessages.length > 0) {
    console.log(
      `📨 Найдено ${missedMessages.length} пропущенных сообщений в чате ${session.chatId}`,
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
            session.workspaceId,
            validationResult.data,
          );
          processed++;
        }
      } catch (msgError) {
        if (isFloodWaitError(msgError)) {
          const waitSeconds = getFloodWaitSeconds(msgError);
          console.warn(
            `⏳ FLOOD_WAIT для сообщения ${msg.id}: ожидание ${waitSeconds} секунд...`,
          );
          await sleep(waitSeconds * 1000);
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
                errors++;
                continue;
              }
              await triggerIncomingMessage(
                session.workspaceId,
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
