/**
 * Сервис для работы с метаданными conversation
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramConversation } from "@qbs-autonaim/db/schema";
import { createLogger } from "../base";

const logger = createLogger("ConversationMetadata");

interface QuestionAnswer {
  question: string;
  answer: string;
  timestamp?: string;
}

interface ConversationMetadata {
  identifiedBy?: "pin_code" | "vacancy_search" | "username" | "none";
  pinCode?: string;
  searchQuery?: string;
  awaitingPin?: boolean;
  interviewStarted?: boolean;
  questionAnswers?: QuestionAnswer[];
  lastQuestionAsked?: string;
  interviewCompleted?: boolean;
  completedAt?: string;
}

/**
 * Получает метаданные conversation
 */
export async function getConversationMetadata(
  conversationId: string,
): Promise<ConversationMetadata> {
  try {
    const conversation = await db.query.telegramConversation.findFirst({
      where: eq(telegramConversation.id, conversationId),
    });

    if (!conversation?.metadata) {
      return {};
    }

    return JSON.parse(conversation.metadata) as ConversationMetadata;
  } catch (error) {
    logger.error("Error getting conversation metadata", {
      error,
      conversationId,
    });
    return {};
  }
}

/**
 * Обновляет метаданные conversation
 */
export async function updateConversationMetadata(
  conversationId: string,
  updates: Partial<ConversationMetadata>,
): Promise<boolean> {
  try {
    const current = await getConversationMetadata(conversationId);
    const updated = { ...current, ...updates };

    await db
      .update(telegramConversation)
      .set({ metadata: JSON.stringify(updated) })
      .where(eq(telegramConversation.id, conversationId));

    return true;
  } catch (error) {
    logger.error("Error updating conversation metadata", {
      error,
      conversationId,
    });
    return false;
  }
}

/**
 * Добавляет вопрос-ответ в историю интервью
 */
export async function addQuestionAnswer(
  conversationId: string,
  question: string,
  answer: string,
): Promise<boolean> {
  try {
    const metadata = await getConversationMetadata(conversationId);
    const questionAnswers = metadata.questionAnswers || [];

    questionAnswers.push({
      question,
      answer,
      timestamp: new Date().toISOString(),
    });

    return await updateConversationMetadata(conversationId, {
      questionAnswers,
      lastQuestionAsked: question,
    });
  } catch (error) {
    logger.error("Error adding question answer", { error, conversationId });
    return false;
  }
}

/**
 * Отмечает интервью как завершенное
 */
export async function markInterviewCompleted(
  conversationId: string,
): Promise<boolean> {
  try {
    return await updateConversationMetadata(conversationId, {
      interviewCompleted: true,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error marking interview completed", {
      error,
      conversationId,
    });
    return false;
  }
}

/**
 * Проверяет, началось ли интервью
 */
export async function isInterviewStarted(
  conversationId: string,
): Promise<boolean> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.interviewStarted === true;
}

/**
 * Проверяет, завершено ли интервью
 */
export async function isInterviewCompleted(
  conversationId: string,
): Promise<boolean> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.interviewCompleted === true;
}

/**
 * Получает количество заданных вопросов
 */
export async function getQuestionCount(
  conversationId: string,
): Promise<number> {
  const metadata = await getConversationMetadata(conversationId);
  return metadata.questionAnswers?.length || 0;
}
