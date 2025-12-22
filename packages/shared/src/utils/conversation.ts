/**
 * Утилиты для работы с метаданными conversation
 */

import { eq, sql } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { conversation } from "@qbs-autonaim/db/schema";
import { z } from "zod";
import type { ConversationMetadata } from "../types/conversation";

/**
 * Zod схема для валидации ConversationMetadata
 */
const QuestionAnswerSchema = z.object({
  question: z.string(),
  answer: z.string(),
  timestamp: z.string().optional(),
});

const ConversationMetadataSchema = z.object({
  identifiedBy: z
    .enum(["pin_code", "vacancy_search", "username", "none"])
    .optional(),
  pinCode: z.string().optional(),
  searchQuery: z.string().optional(),
  awaitingPin: z.boolean().optional(),
  interviewStarted: z.boolean().optional(),
  questionAnswers: z.array(QuestionAnswerSchema).optional(),
  lastQuestionAsked: z.string().optional(),
  interviewCompleted: z.boolean().optional(),
  completedAt: z.string().optional(),
});

/**
 * Безопасно парсит JSON метаданные с валидацией
 * 
 * @param jsonString - JSON строка для парсинга
 * @returns Валидированные метаданные или пустой объект при ошибке
 * @throws Error если JSON невалиден или не соответствует схеме
 */
function safeParseMetadata(jsonString: string): ConversationMetadata {
  try {
    const parsed = JSON.parse(jsonString);
    const validated = ConversationMetadataSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Invalid metadata schema: ${errorMessages}`);
    }
    throw new Error(`Failed to parse metadata JSON: ${error}`);
  }
}

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

    try {
      return safeParseMetadata(conv.metadata);
    } catch (error) {
      console.error("Failed to parse conversation metadata", {
        error,
        conversationId,
        rawMetadata: conv.metadata,
      });
      // Возвращаем пустой объект при невалидных данных
      return {};
    }
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

      // Безопасно парсим и валидируем метаданные
      let currentMetadata: ConversationMetadata = {};
      if (current.metadata) {
        try {
          currentMetadata = safeParseMetadata(current.metadata);
        } catch (error) {
          console.error("Failed to parse conversation metadata", {
            conversationId,
            error,
            rawMetadata: current.metadata,
          });
          // Прерываем транзакцию при невалидных данных
          throw new Error(
            `Cannot update conversation with malformed metadata: ${error}`,
          );
        }
      }

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
