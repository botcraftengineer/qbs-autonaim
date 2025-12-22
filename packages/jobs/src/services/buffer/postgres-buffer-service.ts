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
} from "@qbs-autonaim/shared";
import { eq, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import { createLogger } from "../base";
import { z } from "zod";

const logger = createLogger("PostgresMessageBufferService");

/**
 * Zod схема для валидации BufferedMessage
 */
const BufferedMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  contentType: z.enum(["TEXT", "VOICE"]),
  timestamp: z.number(),
  questionContext: z.string().optional(),
});

/**
 * Zod схема для валидации BufferValue
 */
const BufferValueSchema = z.object({
  messages: z.array(BufferedMessageSchema),
  createdAt: z.number(),
  lastUpdatedAt: z.number(),
  flushId: z.string().optional(),
});

/**
 * Zod схема для валидации MessageBuffer
 */
const MessageBufferSchema = z.record(z.number(), BufferValueSchema);

/**
 * Zod схема для валидации ExtendedConversationMetadata
 */
const ExtendedConversationMetadataSchema = z.object({
  messageBuffer: MessageBufferSchema.optional(),
}).passthrough(); // Разрешаем дополнительные поля из базовой ConversationMetadata

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
   * Использует транзакцию с оптимистической блокировкой для защиты от race conditions.
   */
  async addMessage(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
    message: BufferedMessage;
  }): Promise<void> {
    // Валидация пустых сообщений (Requirements 8.1)
    if (!params.message.content.trim()) {
      logger.debug("Ignoring empty message", {
        conversationId: params.conversationId,
        interviewStep: params.interviewStep,
      });
      return;
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const success = await db.transaction(async (tx) => {
          // Читаем текущие метаданные и версию внутри транзакции
          const current = await tx.query.conversation.findFirst({
            where: eq(conversation.id, params.conversationId),
            columns: {
              metadata: true,
              metadataVersion: true,
            },
          });

          if (!current) {
            throw new Error(
              `Conversation not found for conversationId: ${params.conversationId}`,
            );
          }

          // Парсим метаданные с валидацией через Zod
          let metadata: ExtendedConversationMetadata;
          if (current.metadata) {
            const parseResult = ExtendedConversationMetadataSchema.safeParse(
              JSON.parse(current.metadata)
            );
            
            if (parseResult.success) {
              metadata = parseResult.data;
            } else {
              logger.error("Failed to validate metadata, using empty object", {
                conversationId: params.conversationId,
                errors: parseResult.error.issues,
              });
              metadata = {};
            }
          } else {
            metadata = {};
          }

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

          // Обновляем с проверкой версии (оптимистичная блокировка)
          const result = await tx
            .update(conversation)
            .set({
              metadata: JSON.stringify(metadata),
              metadataVersion: sql`${conversation.metadataVersion} + 1`,
            })
            .where(
              sql`${conversation.id} = ${params.conversationId} AND ${conversation.metadataVersion} = ${current.metadataVersion}`,
            )
            .returning({ updatedId: conversation.id });

          // Если ничего не обновилось, значит была конкуренция
          if (result.length === 0) {
            logger.debug("Optimistic lock conflict, will retry", {
              conversationId: params.conversationId,
              interviewStep: params.interviewStep,
              attempt: attempt + 1,
              expectedVersion: current.metadataVersion,
            });
            return false;
          }

          logger.debug("Message added to buffer", {
            conversationId: params.conversationId,
            interviewStep: params.interviewStep,
            messageId: params.message.id,
            bufferSize: buffer?.messages.length || 0,
            attempt: attempt + 1,
          });

          return true;
        });

        if (success) {
          return;
        }

        // Конфликт версии, повторяем попытку
        attempt++;
        if (attempt < maxRetries) {
          // Экспоненциальная задержка перед повтором
          await new Promise((resolve) =>
            setTimeout(resolve, 2 ** attempt * 10),
          );
        }
      } catch (error) {
        logger.error("Error adding message to buffer", {
          error,
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
          attempt: attempt + 1,
        });
        throw error;
      }
    }

    // Если все попытки исчерпаны
    throw new Error(
      `Failed to add message after ${maxRetries} attempts due to concurrent modifications`,
    );
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
      const rawMetadata = await getConversationMetadata(
        params.conversationId,
      );

      if (!rawMetadata) {
        logger.debug("Conversation metadata not found, returning empty array", {
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
        });
        return [];
      }

      const metadata = rawMetadata as ExtendedConversationMetadata;

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
   * Использует транзакцию с оптимистической блокировкой для защиты от race conditions.
   */
  async clearBuffer(params: {
    userId: string;
    conversationId: string;
    interviewStep: number;
  }): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const success = await db.transaction(async (tx) => {
          // Читаем текущие метаданные и версию внутри транзакции
          const current = await tx.query.conversation.findFirst({
            where: eq(conversation.id, params.conversationId),
            columns: {
              metadata: true,
              metadataVersion: true,
            },
          });

          if (!current) {
            logger.debug("Conversation not found, nothing to clear", {
              conversationId: params.conversationId,
              interviewStep: params.interviewStep,
            });
            return true; // Нечего удалять, считаем успехом
          }

          // Парсим метаданные с валидацией через Zod
          let metadata: ExtendedConversationMetadata;
          if (current.metadata) {
            const parseResult = ExtendedConversationMetadataSchema.safeParse(
              JSON.parse(current.metadata)
            );
            
            if (parseResult.success) {
              metadata = parseResult.data;
            } else {
              logger.error("Failed to validate metadata, using empty object", {
                conversationId: params.conversationId,
                errors: parseResult.error.issues,
              });
              metadata = {};
            }
          } else {
            metadata = {};
          }

          // Проверяем существование буфера для удаления
          if (!metadata.messageBuffer?.[params.interviewStep]) {
            logger.debug("Buffer not found, nothing to clear", {
              conversationId: params.conversationId,
              interviewStep: params.interviewStep,
            });
            return true; // Нечего удалять, считаем успехом
          }

          // Удаляем буфер для указанного interviewStep
          delete metadata.messageBuffer[params.interviewStep];

          // Обновляем с проверкой версии (оптимистичная блокировка)
          const result = await tx
            .update(conversation)
            .set({
              metadata: JSON.stringify(metadata),
              metadataVersion: sql`${conversation.metadataVersion} + 1`,
            })
            .where(
              sql`${conversation.id} = ${params.conversationId} AND ${conversation.metadataVersion} = ${current.metadataVersion}`,
            )
            .returning({ updatedId: conversation.id });

          // Если ничего не обновилось, значит была конкуренция
          if (result.length === 0) {
            logger.debug("Optimistic lock conflict, will retry", {
              conversationId: params.conversationId,
              interviewStep: params.interviewStep,
              attempt: attempt + 1,
              expectedVersion: current.metadataVersion,
            });
            return false;
          }

          logger.debug("Buffer cleared", {
            conversationId: params.conversationId,
            interviewStep: params.interviewStep,
            attempt: attempt + 1,
          });

          return true;
        });

        if (success) {
          return;
        }

        // Конфликт версии, повторяем попытку
        attempt++;
        if (attempt < maxRetries) {
          // Экспоненциальная задержка перед повтором
          await new Promise((resolve) =>
            setTimeout(resolve, 2 ** attempt * 10),
          );
        }
      } catch (error) {
        logger.error("Error clearing buffer", {
          error,
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
          attempt: attempt + 1,
        });
        throw error;
      }
    }

    // Если все попытки исчерпаны
    throw new Error(
      `Failed to clear buffer after ${maxRetries} attempts due to concurrent modifications`,
    );
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
      const rawMetadata = await getConversationMetadata(
        params.conversationId,
      );

      if (!rawMetadata) {
        logger.debug("Conversation metadata not found", {
          conversationId: params.conversationId,
          interviewStep: params.interviewStep,
        });
        return false;
      }

      const metadata = rawMetadata as ExtendedConversationMetadata;

      const buffer = metadata.messageBuffer?.[params.interviewStep];
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
