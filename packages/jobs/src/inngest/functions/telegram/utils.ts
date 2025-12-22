import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  companySettings,
  conversationMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import {
  type BufferedTempMessageData,
  tempMessageBufferService,
} from "~/services/buffer/temp-message-buffer-service";
import { getTempMessageHistory } from "./handlers/unidentified/temp-message-storage";
import type { BotSettings } from "./types";

export function extractPinCode(text: string): string | null {
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

export async function findDuplicateMessage(
  conversationId: string,
  externalMessageId: string,
): Promise<boolean> {
  const existingMessage = await db.query.conversationMessage.findFirst({
    where: (messages, { and, eq }) =>
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.externalMessageId, externalMessageId),
      ),
  });
  return !!existingMessage;
}

export async function getCompanyBotSettings(
  workspaceId: string,
): Promise<BotSettings> {
  try {
    const company = await db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, workspaceId),
    });
    return {
      botName: company?.botName ?? "Дмитрий",
      botRole: company?.botRole ?? "рекрутер",
    };
  } catch (error) {
    console.error(
      "❌ Ошибка загрузки настроек бота, используем значения по умолчанию",
      {
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      botName: "Дмитрий",
      botRole: "рекрутер",
    };
  }
}

function isValidSender(value: unknown): value is "CANDIDATE" | "BOT" {
  return value === "CANDIDATE" || value === "BOT";
}

function isValidContentType(value: unknown): value is "TEXT" | "VOICE" {
  return value === "TEXT" || value === "VOICE";
}

export async function getConversationHistory(conversationId: string) {
  if (conversationId.startsWith("temp_")) {
    const bufferedMessages = await tempMessageBufferService.getMessages({
      tempConversationId: conversationId,
    });

    const tempMessages = await getTempMessageHistory(conversationId);

    const allMessages = [
      ...tempMessages.map((msg) => ({
        id: msg.id,
        conversationId: msg.tempConversationId,
        sender: msg.sender as "CANDIDATE" | "BOT",
        contentType: msg.contentType as "TEXT" | "VOICE",
        channel: "TELEGRAM" as const,
        content: msg.content,
        fileId: null,
        voiceDuration: null,
        voiceTranscription: null,
        externalMessageId: msg.externalMessageId,
        createdAt: msg.createdAt,
        timestamp: msg.createdAt,
      })),
      ...bufferedMessages.map((msg: BufferedTempMessageData) => ({
        id: msg.id,
        conversationId,
        sender: msg.sender,
        contentType: msg.contentType,
        channel: "TELEGRAM" as const,
        content: msg.content,
        fileId: null,
        voiceDuration: null,
        voiceTranscription: null,
        externalMessageId: msg.externalMessageId,
        createdAt: msg.timestamp,
        timestamp: msg.timestamp,
      })),
    ];

    return allMessages
      .filter((msg) => {
        const isValid =
          isValidSender(msg.sender) && isValidContentType(msg.contentType);
        if (!isValid) {
          console.error("❌ Невалидное временное сообщение, пропускаем", {
            id: msg.id,
            sender: msg.sender,
            contentType: msg.contentType,
          });
        }
        return isValid;
      })
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  const messages = await db.query.conversationMessage.findMany({
    where: eq(conversationMessage.conversationId, conversationId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    limit: 10,
  });

  // Для голосовых сообщений используем транскрибацию вместо "Голосовое сообщение"
  return messages.map((msg) => ({
    ...msg,
    content:
      msg.contentType === "VOICE" && msg.voiceTranscription
        ? msg.voiceTranscription
        : msg.content,
  }));
}

/**
 * Находит conversation по chatId через связь с vacancyResponse
 */
export async function findConversationByChatId(chatId: string) {
  return await db.query.conversation.findFirst({
    where: (fields, { inArray }) => {
      return inArray(
        fields.responseId,
        db
          .select({ id: vacancyResponse.id })
          .from(vacancyResponse)
          .where(eq(vacancyResponse.chatId, chatId)),
      );
    },
    with: {
      response: {
        with: {
          vacancy: true,
        },
      },
    },
  });
}

/**
 * Создает или возвращает временный ID для неидентифицированного пользователя
 * Используется для хранения сообщений до идентификации по пин-коду
 *
 * ВАЖНО: Возвращает chatId как временный ID, так как conversation
 * требует обязательный responseId, который мы не можем создать без вакансии.
 * Сообщения будут храниться с этим временным ID до идентификации.
 */
export async function createOrUpdateTempConversation(
  chatId: string,
  _username?: string,
  _firstName?: string,
): Promise<{ id: string } | null> {
  try {
    // Используем chatId как временный ID для неидентифицированных разговоров
    // Это позволяет сохранять сообщения до идентификации пользователя
    return { id: `temp_${chatId}` };
  } catch (error) {
    console.error("Ошибка создания временного ID:", {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
