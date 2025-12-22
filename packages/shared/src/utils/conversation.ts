/**
 * Утилиты для работы с метаданными conversation
 */

import { eq } from "@qbs-autonaim/db";
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
    const current = await getConversationMetadata(conversationId);
    const updated = { ...current, ...updates };

    await db
      .update(conversation)
      .set({ metadata: JSON.stringify(updated) })
      .where(eq(conversation.id, conversationId));

    return true;
  } catch (error) {
    console.error("Error updating conversation metadata", {
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
