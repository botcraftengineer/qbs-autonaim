/**
 * PostgreSQL-based реализация сервиса буферизации сообщений
 * 
 * Использует отдельную таблицу message_buffers для хранения буферов.
 * Буферы изолированы по conversationId и interviewStep.
 */

import type {
  BufferedMessage,
  MessageBufferService,
} from "@qbs-autonaim/shared";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { messageBuffer } from "@qbs-autonaim/db/schema";
import { createLogger } from "../base";

const logger = createLogger("PostgresMessageBufferService");

/**
 * PostgreSQL-based реализация MessageBufferService
 * 
 * Хранит буферы сообщений в отдельной таблице message_buffers.
 * Каждый буфер изолирован по conversationId и interviewStep.
 */
export class PostgresMessageBufferService implements MessageBufferService {
  /**
   * Добавить сообщение в буфер
   * 
   * Валидирует сообщение (отклоняет пустые), инициализирует буфер если нужно,
   * и добавляет сообщение в массив для соответствующего interviewStep.
   */
  async addMessage(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void> {
    // Валидация пустых сообщений
    if (!params.message.content.trim()) {
      logger.debug("Ignoring empty message", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      return;
    }

    try {
      await db.transaction(async (tx) => {
        // Ищем существующий буфер
        const existing = await tx.query.messageBuffer.findFirst({
          where: and(
            eq(messageBuffer.conversationId, params.conversationId),
            eq(messageBuffer.interviewStep, params.interviewStep),
          ),
        });

        const now = Date.now();

        if (existing) {
          // Обновляем существующий буфер
          const messages = [...existing.messages, params.message];

          await tx
            .update(messageBuffer)
            .set({
              messages,
              lastUpdatedAt: now,
            })
            .where(eq(messageBuffer.id, existing.id));

          logger.debug("Message added to existing buffer", {
            conversationId: params.conversationId,
            interviewStep: params.interviewStep,
            messageId: params.message.id,
            bufferSize: messages.length,
          });
        } else {
          // Создаем новый буфер
          await tx.insert(messageBuffer).values({
            conversationId: params.conversationId,
            userId: params.userId,
            interviewStep: params.interviewStep,
            messages: [params.message],
            createdAt: now,
            lastUpdatedAt: now,
          });

          logger.debug("Message added to new buffer", {
            conversationId: params.conversationId,
            interviewStep: params.interviewStep,
            messageId: params.message.id,
          });
        }
      });
    } catch (error) {
      logger.error("Error adding message to buffer", {
        error,
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      throw error;
    }
  }

  /**
   * Получить все сообщения из буфера
   * 
   * Возвращает массив сообщений для указанного interviewStep.
   * Если буфер не существует, возвращает пустой массив.
   */
  async getMessages(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<BufferedMessage[]> {
    try {
      const buffer = await db.query.messageBuffer.findFirst({
        where: and(
          eq(messageBuffer.conversationId, params.conversationId),
          eq(messageBuffer.interviewStep, params.interviewStep),
        ),
      });

      const messages = buffer?.messages || [];

      logger.debug("Retrieved messages from buffer", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
        messageCount: messages.length,
      });

      return messages;
    } catch (error) {
      logger.error("Error getting messages from buffer", {
        error,
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      return [];
    }
  }

  /**
   * Очистить буфер для конкретного шага интервью
   * 
   * Удаляет буфер для указанного interviewStep.
   */
  async clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void> {
    try {
      await db
        .delete(messageBuffer)
        .where(
          and(
            eq(messageBuffer.conversationId, params.conversationId),
            eq(messageBuffer.interviewStep, params.interviewStep),
          ),
        );

      logger.debug("Buffer cleared", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
    } catch (error) {
      logger.error("Error clearing buffer", {
        error,
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      throw error;
    }
  }

  /**
   * Проверить существование буфера
   * 
   * Возвращает true если буфер существует и содержит сообщения.
   */
  async hasBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<boolean> {
    try {
      const buffer = await db.query.messageBuffer.findFirst({
        where: and(
          eq(messageBuffer.conversationId, params.conversationId),
          eq(messageBuffer.interviewStep, params.interviewStep),
        ),
      });

      const hasBuffer =
        buffer !== undefined &&
        buffer !== null &&
        Array.isArray(buffer.messages) &&
        buffer.messages.length > 0;

      logger.debug("Checked buffer existence", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
        hasBuffer,
      });

      return hasBuffer;
    } catch (error) {
      logger.error("Error checking buffer existence", {
        error,
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      return false;
    }
  }
}
