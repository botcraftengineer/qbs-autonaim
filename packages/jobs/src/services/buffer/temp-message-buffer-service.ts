/**
 * Сервис буферизации временных сообщений для неидентифицированных пользователей
 *
 * Использует отдельную таблицу buffered_temp_messages для хранения сообщений.
 * Каждое сообщение в отдельной строке для предотвращения затирания.
 */

import { asc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { bufferedTempMessage } from "@qbs-autonaim/db/schema";
import { createLogger } from "../base";

const logger = createLogger("TempMessageBufferService");

export interface BufferedTempMessageData {
  id: string;
  content: string;
  contentType: "TEXT" | "VOICE";
  sender: "CANDIDATE" | "BOT";
  timestamp: Date;
  externalMessageId?: string;
}

export class TempMessageBufferService {
  /**
   * Добавить сообщение в буфер
   */
  async addMessage(params: {
    tempConversationId: string;
    chatId: string;
    message: BufferedTempMessageData;
  }): Promise<void> {
    if (!params.message.content?.trim()) {
      logger.warn("Попытка добавить пустое сообщение в буфер", {
        tempConversationId: params.tempConversationId,
      });
      return;
    }

    try {
      await db.insert(bufferedTempMessage).values({
        messageId: params.message.id,
        tempConversationId: params.tempConversationId,
        chatId: params.chatId,
        sender: params.message.sender,
        contentType: params.message.contentType,
        content: params.message.content,
        externalMessageId: params.message.externalMessageId,
        timestamp: params.message.timestamp,
      });

      logger.info("Сообщение добавлено в буфер", {
        tempConversationId: params.tempConversationId,
        messageId: params.message.id,
      });
    } catch (error) {
      logger.error("Ошибка добавления сообщения в буфер", {
        tempConversationId: params.tempConversationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Получить все буферизованные сообщения
   */
  async getMessages(params: {
    tempConversationId: string;
  }): Promise<BufferedTempMessageData[]> {
    try {
      const messages = await db.query.bufferedTempMessage.findMany({
        where: eq(
          bufferedTempMessage.tempConversationId,
          params.tempConversationId,
        ),
        orderBy: [asc(bufferedTempMessage.timestamp)],
      });

      return messages.map((msg) => ({
        id: msg.messageId,
        content: msg.content,
        contentType: msg.contentType as "TEXT" | "VOICE",
        sender: msg.sender as "CANDIDATE" | "BOT",
        timestamp: msg.timestamp,
        externalMessageId: msg.externalMessageId ?? undefined,
      }));
    } catch (error) {
      logger.error("Ошибка получения буферизованных сообщений", {
        tempConversationId: params.tempConversationId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Очистить буфер после обработки
   */
  async clearBuffer(params: { tempConversationId: string }): Promise<void> {
    try {
      await db
        .delete(bufferedTempMessage)
        .where(
          eq(bufferedTempMessage.tempConversationId, params.tempConversationId),
        );

      logger.info("Буфер очищен", {
        tempConversationId: params.tempConversationId,
      });
    } catch (error) {
      logger.error("Ошибка очистки буфера", {
        tempConversationId: params.tempConversationId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Проверить наличие сообщений в буфере
   */
  async hasMessages(params: { tempConversationId: string }): Promise<boolean> {
    try {
      const message = await db.query.bufferedTempMessage.findFirst({
        where: eq(
          bufferedTempMessage.tempConversationId,
          params.tempConversationId,
        ),
      });

      return !!message;
    } catch (error) {
      logger.error("Ошибка проверки наличия сообщений в буфере", {
        tempConversationId: params.tempConversationId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

export const tempMessageBufferService = new TempMessageBufferService();
