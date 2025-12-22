/**
 * PostgreSQL-based реализация сервиса буферизации сообщений
 * 
 * Использует поле metadata в таблице conversations для хранения буферов.
 * Буферы изолированы по interviewStep внутри каждого conversation.
 */

import type {
  BufferedMessage,
  BufferValue,
  MessageBufferService,
} from "@qbs-autonaim/shared";
import {
  getConversationMetadata,
  updateConversationMetadata,
} from "@qbs-autonaim/shared";
import { createLogger } from "../base";

const logger = createLogger("PostgresMessageBufferService");

/**
 * Расширение ConversationMetadata для поддержки буферизации
 */
interface MessageBuffer {
  [interviewStep: number]: BufferValue;
}

interface ExtendedConversationMetadata {
  messageBuffer?: MessageBuffer;
  [key: string]: unknown;
}

/**
 * PostgreSQL-based реализация MessageBufferService
 * 
 * Хранит буферы сообщений в поле metadata таблицы conversations.
 * Каждый буфер изолирован по interviewStep.
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
    try {
      // Валидация пустых сообщений (Requirements 8.1)
      if (!params.message.content.trim()) {
        logger.debug("Ignoring empty message", {
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
        });
        return;
      }

      // Получение текущих метаданных
      const metadata =
        (await getConversationMetadata(
          params.conversationId,
        )) as ExtendedConversationMetadata;

      // Инициализация messageBuffer если не существует
      if (!metadata.messageBuffer) {
        metadata.messageBuffer = {};
      }

      // Инициализация буфера для текущего interviewStep если не существует
      if (!metadata.messageBuffer[params.interviewStep]) {
        metadata.messageBuffer[params.interviewStep] = {
          messages: [],
          createdAt: Date.now(),
          lastUpdatedAt: Date.now(),
        };
      }

      // Добавление сообщения в буфер
      const buffer = metadata.messageBuffer[params.interviewStep];
      if (buffer) {
        buffer.messages.push(params.message);
        buffer.lastUpdatedAt = Date.now();
      }

      // Сохранение обновленных метаданных
      await updateConversationMetadata(
        params.conversationId,
        metadata as Record<string, unknown>,
      );

      logger.debug("Message added to buffer", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
        messageId: params.message.id,
        bufferSize: buffer?.messages.length || 0,
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
      const metadata =
        (await getConversationMetadata(
          params.conversationId,
        )) as ExtendedConversationMetadata;

      const messages =
        metadata.messageBuffer?.[params.interviewStep]?.messages || [];

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
   * Удаляет буфер для указанного interviewStep из metadata.
   */
  async clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void> {
    try {
      const metadata =
        (await getConversationMetadata(
          params.conversationId,
        )) as ExtendedConversationMetadata;

      if (metadata.messageBuffer?.[params.interviewStep]) {
        delete metadata.messageBuffer[params.interviewStep];
        await updateConversationMetadata(
          params.conversationId,
          metadata as Record<string, unknown>,
        );

        logger.debug("Buffer cleared", {
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
        });
      }
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
      const metadata =
        (await getConversationMetadata(
          params.conversationId,
        )) as ExtendedConversationMetadata;

      const hasBuffer = !!metadata.messageBuffer?.[params.interviewStep];

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
