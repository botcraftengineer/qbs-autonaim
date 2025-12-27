/**
 * Утилиты для работы с метаданными conversation
 */

import { eq } from "@qbs-autonaim/db";
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
    .enum(["pin_code", "vacancy_search", "username", "phone", "none"])
    .optional(),
  pinCode: z.string().optional(),
  username: z.string().optional(),
  phone: z.string().optional(),
  searchQuery: z.string().optional(),
  awaitingPin: z.boolean().optional(),
  interviewStarted: z.boolean().optional(),
  questionAnswers: z.array(QuestionAnswerSchema).optional(),
  lastQuestionAsked: z.string().optional(),
  interviewCompleted: z.boolean().optional(),
  completedAt: z.string().optional(),
});

/**
 * Экспортируем схему для использования в других модулях
 */
export { ConversationMetadataSchema };

/**
 * Безопасно парсит и валидирует метаданные
 *
 * @param metadata - Объект метаданных для валидации
 * @returns Валидированные метаданные
 * @throws Error если метаданные не соответствуют схеме
 */
function safeParseMetadata(
  metadata: Record<string, unknown>,
): ConversationMetadata {
  try {
    const validated = ConversationMetadataSchema.parse(metadata);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Invalid metadata schema: ${errorMessages}`);
    }
    throw new Error(`Failed to validate metadata: ${error}`);
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
 * Обновляет метаданные conversation
 *
 * @param conversationId - ID разговора
 * @param updates - Частичные обновления метаданных
 * @returns Promise с true если обновление успешно, false в противном случае
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: Partial<ConversationMetadata>,
): Promise<boolean> {
  try {
    // Читаем текущие метаданные
    const current = await db.query.conversation.findFirst({
      where: eq(conversation.id, conversationId),
      columns: {
        metadata: true,
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
        // Прерываем при невалидных данных
        throw new Error(
          `Cannot update conversation with malformed metadata: ${error}`,
        );
      }
    }

    const updatedMetadata = { ...currentMetadata, ...updates };

    // Обновляем метаданные
    await db
      .update(conversation)
      .set({
        metadata: updatedMetadata,
      })
      .where(eq(conversation.id, conversationId));

    return true;
  } catch (error) {
    console.error("Error in updateConversationMetadata", {
      error,
      conversationId,
    });
    return false;
  }
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
