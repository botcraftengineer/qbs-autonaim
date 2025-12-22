/**
 * Утилиты для работы с метаданными conversation
 */

import { eq, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import type { ConversationMetadata } from "../types/conversation";

/**
 * Получает метаданные conversation
 * 
 * @param conversationId - ID разговора
 * @returns Promise с метаданными conversation
 */
export async function getConversationMetadata(
  conversationId: string,
): Promise<ConversationMetadata> {
  try {
    const conv = await db.query.conversation.findFirst({
      where: eq(conversation.id, conversationId),
    });

    if (!conv?.metadata) {
      return {};
    }

    return JSON.parse(conv.metadata) as ConversationMetadata;
  } catch (error) {
    console.error("Error getting conversation metadata", {
      error,
      conversationId,
    });
    return {};
  }
}

/**
 * Обновляет метаданные conversation с использованием оптимистичной блокировки
 * 
 * @param conversationId - ID разговора
 * @param updates - Частичные обновления метаданных
 * @returns Promise с true если обновление успешно, false в противном случае
 */
async function updateWithOptimisticLock(
  conversationId: string,
  updates: Partial<ConversationMetadata>,
): Promise<boolean> {
  try {
    return await db.transaction(async (tx) => {
      // Читаем текущие метаданные и версию внутри транзакции
      const current = await tx.query.conversation.findFirst({
        where: eq(conversation.id, conversationId),
        columns: {
          metadata: true,
          metadataVersion: true,
        },
      });

      if (!current) {
        console.error("Conversation not found", { conversationId });
        return false;
      }

      // Парсим и мержим метаданные
      const currentMetadata = current.metadata
        ? (JSON.parse(current.metadata) as ConversationMetadata)
        : {};
      const updatedMetadata = { ...currentMetadata, ...updates };

      // Обновляем с проверкой версии (оптимистичная блокировка)
      const result = await tx
        .update(conversation)
        .set({
          metadata: JSON.stringify(updatedMetadata),
          metadataVersion: sql`${conversation.metadataVersion} + 1`,
        })
        .where(
          sql`${conversation.id} = ${conversationId} AND ${conversation.metadataVersion} = ${current.metadataVersion}`,
        )
        .returning({ updatedId: conversation.id });

      // Если ничего не обновилось, значит была конкуренция
      if (result.length === 0) {
        console.warn("Optimistic lock conflict detected", {
          conversationId,
          expectedVersion: current.metadataVersion,
        });
        return false;
      }

      return true;
    });
  } catch (error) {
    console.error("Error in updateWithOptimisticLock", {
      error,
      conversationId,
    });
    return false;
  }
}

/**
 * Обновляет метаданные conversation с автоматическими повторными попытками
 * 
 * @param conversationId - ID разговора
 * @param updates - Частичные обновления метаданных
 * @param options - Опции обновления
 * @param options.maxRetries - Максимальное количество попыток (по умолчанию 3)
 * @returns Promise с true если обновление успешно, false в противном случае
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: Partial<ConversationMetadata>,
  options?: { maxRetries?: number },
): Promise<boolean> {
  const maxRetries = options?.maxRetries ?? 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const success = await updateWithOptimisticLock(conversationId, updates);

    if (success) {
      return true;
    }

    // Если это не последняя попытка, логируем и пробуем снова
    if (attempt < maxRetries) {
      console.info("Retrying metadata update", {
        conversationId,
        attempt,
        maxRetries,
      });
      // Небольшая задержка перед повторной попыткой
      await new Promise((resolve) => setTimeout(resolve, 10 * attempt));
    }
  }

  console.error("Failed to update conversation metadata after all retries", {
    conversationId,
    maxRetries,
  });
  return false;
}

/**
 * Получает количество заданных вопросов
 * 
 * @param conversationId - ID разговора
 * @returns Promise с количеством вопросов
 */
export async function getQuestionCount(
  conversationId: string,
): Promise<number> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.questionAnswers?.length || 0;
}
