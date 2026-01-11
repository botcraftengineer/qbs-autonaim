/**
 * PostgreSQL-based реализация сервиса буферизации сообщений интервью
 *
 * Использует отдельную таблицу buffered_messages для хранения сообщений.
 * Каждое сообщение в отдельной строке для предотвращения затирания.
 */

import { and, asc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { bufferedMessage } from "@qbs-autonaim/db/schema";
import type {
  BufferedMessage,
  MessageBufferService,
} from "@qbs-autonaim/shared";
import { createLogger } from "../base";

const logger = createLogger("PostgresMessageBufferService");

/**
 * PostgreSQL-based реализация MessageBufferService
 *
 * Хранит каждое сообщение в отдельной строке таблицы buffered_messages.
 * Предотвращает затирание сообщений при конкурентных операциях.
 */
export class PostgresMessageBufferService implements MessageBufferService {
  /**
   * Добавить сообщение в буфер
   *
   * Валидирует сообщение (отклоняет пустые) и добавляет его как отдельную строку.
   * Каждое сообщение независимо, что предотвращает затирание при конкурентных операциях.
   */
  async addMessage(params: {
    userId: string;
    interviewSessionId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void> {
    // Валидация пустых сообщений
    if (!params.message.content.trim()) {
      logger.debug("Ignoring empty message", {
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
      return;
    }

    try {
      await db.insert(bufferedMessage).values({
        messageId: params.message.id,
        interviewSessionId: params.interviewSessionId,
        userId: params.userId,
        interviewStep: params.interviewStep,
        content: params.message.content,
        contentType: params.message.contentType,
        questionContext: params.message.questionContext,
        timestamp: params.message.timestamp,
      });

      logger.debug("Message added to buffer", {
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
        messageId: params.message.id,
      });
    } catch (error) {
      logger.error("Error adding message to buffer", {
        error,
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
      throw error;
    }
  }

  /**
   * Получить все сообщения из буфера
   *
   * Возвращает массив сообщений для указанного interviewStep,
   * отсортированных по timestamp.
   */
  async getMessages(params: {
    userId: string;
    interviewSessionId: string;
    interviewStep: number;
  }): Promise<BufferedMessage[]> {
    try {
      const messages = await db.query.bufferedMessage.findMany({
        where: and(
          eq(bufferedMessage.interviewSessionId, params.interviewSessionId),
          eq(bufferedMessage.interviewStep, params.interviewStep),
        ),
        orderBy: [asc(bufferedMessage.timestamp)],
      });

      const result = messages.map((msg) => ({
        id: msg.messageId,
        content: msg.content,
        contentType: msg.contentType as "TEXT" | "VOICE",
        timestamp: msg.timestamp,
        questionContext: msg.questionContext || undefined,
      }));

      logger.debug("Retrieved messages from buffer", {
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
        messageCount: result.length,
      });

      return result;
    } catch (error) {
      logger.error("Error getting messages from buffer", {
        error,
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
      return [];
    }
  }

  /**
   * Очистить буфер для конкретного шага интервью
   *
   * Удаляет все сообщения для указанного interviewStep.
   */
  async clearBuffer(params: {
    userId: string;
    interviewSessionId: string;
    interviewStep: number;
  }): Promise<void> {
    try {
      await db
        .delete(bufferedMessage)
        .where(
          and(
            eq(bufferedMessage.interviewSessionId, params.interviewSessionId),
            eq(bufferedMessage.interviewStep, params.interviewStep),
          ),
        );

      logger.debug("Buffer cleared", {
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
    } catch (error) {
      logger.error("Error clearing buffer", {
        error,
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
      throw error;
    }
  }

  /**
   * Проверить существование буфера
   *
   * Возвращает true если существует хотя бы одно сообщение для указанного interviewStep.
   */
  async hasBuffer(params: {
    userId: string;
    interviewSessionId: string;
    interviewStep: number;
  }): Promise<boolean> {
    try {
      const message = await db.query.bufferedMessage.findFirst({
        where: and(
          eq(bufferedMessage.interviewSessionId, params.interviewSessionId),
          eq(bufferedMessage.interviewStep, params.interviewStep),
        ),
      });

      const hasBuffer = message !== undefined && message !== null;

      logger.debug("Checked buffer existence", {
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
        hasBuffer,
      });

      return hasBuffer;
    } catch (error) {
      logger.error("Error checking buffer existence", {
        error,
        interviewSessionId: params.interviewSessionId,
        interviewStep: params.interviewStep,
      });
      return false;
    }
  }
}
