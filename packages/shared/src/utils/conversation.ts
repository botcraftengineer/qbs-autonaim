/**
 * Утилиты для работы с метаданными chat session и interview session
 */

import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { chatSession, interviewSession } from "@qbs-autonaim/db/schema";
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

const InterviewNoteSchema = z.object({
  type: z.enum(["note", "signal"]),
  content: z.string(),
  tag: z.string().optional(),
  timestamp: z.string(),
});

const InterviewRubricSchema = z.object({
  version: z.string().optional(),
  entityType: z.enum(["gig", "vacancy", "unknown"]).optional(),
  criteria: z.array(
    z.object({
      key: z.string(),
      title: z.string(),
      description: z.string(),
      weight: z.number(),
    }),
  ),
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
  candidateName: z.string().optional(),
  interviewNotes: z.array(InterviewNoteSchema).optional(),
  interviewRubric: InterviewRubricSchema.optional(),
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
 * Получает метаданные chat session
 *
 * @param sessionId - ID сессии
 * @returns Promise с метаданными
 */
export async function getConversationMetadata(
  sessionId: string,
): Promise<ConversationMetadata> {
  try {
    const session = await db.query.chatSession.findFirst({
      where: eq(chatSession.id, sessionId),
    });

    if (!session?.metadata) {
      return {};
    }

    try {
      return safeParseMetadata(session.metadata);
    } catch (error) {
      console.error("Failed to parse chat session metadata", {
        error,
        sessionId,
        rawMetadata: session.metadata,
      });
      // Возвращаем пустой объект при невалидных данных
      return {};
    }
  } catch (error) {
    console.error("Error getting chat session metadata", {
      error,
      sessionId,
    });
    return {};
  }
}

/**
 * Обновляет метаданные chat session
 *
 * @param sessionId - ID сессии
 * @param updates - Частичные обновления метаданных
 * @returns Promise с true если обновление успешно, false в противном случае
 */
export async function updateConversationMetadata(
  sessionId: string,
  updates: Partial<ConversationMetadata>,
): Promise<boolean> {
  try {
    // Читаем текущие метаданные
    const current = await db.query.chatSession.findFirst({
      where: eq(chatSession.id, sessionId),
      columns: {
        metadata: true,
      },
    });

    if (!current) {
      console.error("Chat session not found", { sessionId });
      return false;
    }

    // Безопасно парсим и валидируем метаданные
    let currentMetadata: ConversationMetadata = {};
    if (current.metadata) {
      try {
        currentMetadata = safeParseMetadata(current.metadata);
      } catch (error) {
        console.error("Failed to parse chat session metadata", {
          sessionId,
          error,
          rawMetadata: current.metadata,
        });
        // Прерываем при невалидных данных
        throw new Error(
          `Cannot update chat session with malformed metadata: ${error}`,
        );
      }
    }

    const updatedMetadata = { ...currentMetadata, ...updates };

    // Обновляем метаданные
    await db
      .update(chatSession)
      .set({
        metadata: updatedMetadata,
      })
      .where(eq(chatSession.id, sessionId));

    return true;
  } catch (error) {
    console.error("Error in updateConversationMetadata", {
      error,
      sessionId,
    });
    return false;
  }
}

/**
 * Получает количество заданных вопросов
 *
 * @param sessionId - ID сессии
 * @returns Promise с количеством вопросов
 */
export async function getQuestionCount(sessionId: string): Promise<number> {
  const metadata = await getConversationMetadata(sessionId);
  return metadata.questionAnswers?.length || 0;
}

/**
 * Алиасы для совместимости с новым именованием
 */
export const getChatSessionMetadata = getConversationMetadata;
export const updateChatSessionMetadata = updateConversationMetadata;

// ==================== INTERVIEW SESSION METADATA ====================

/**
 * Получает метаданные interview session
 *
 * @param sessionId - ID сессии интервью
 * @returns Promise с метаданными
 */
export async function getInterviewSessionMetadata(
  sessionId: string,
): Promise<ConversationMetadata> {
  try {
    const session = await db.query.interviewSession.findFirst({
      where: eq(interviewSession.id, sessionId),
    });

    if (!session?.metadata) {
      return {};
    }

    try {
      return safeParseMetadata(session.metadata as Record<string, unknown>);
    } catch (error) {
      console.error("Failed to parse interview session metadata", {
        error,
        sessionId,
        rawMetadata: session.metadata,
      });
      return {};
    }
  } catch (error) {
    console.error("Error getting interview session metadata", {
      error,
      sessionId,
    });
    return {};
  }
}

/**
 * Обновляет метаданные interview session с оптимистической блокировкой
 *
 * @param sessionId - ID сессии интервью
 * @param updates - Частичные обновления метаданных
 * @returns Promise с true если обновление успешно, false в противном случае
 */
export async function updateInterviewSessionMetadata(
  sessionId: string,
  updates: Partial<ConversationMetadata>,
): Promise<boolean> {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const current = await db.query.interviewSession.findFirst({
        where: eq(interviewSession.id, sessionId),
        columns: {
          metadata: true,
          updatedAt: true,
        },
      });

      if (!current) {
        console.error("Interview session not found", { sessionId });
        return false;
      }

      let currentMetadata: ConversationMetadata = {};
      if (current.metadata) {
        try {
          currentMetadata = safeParseMetadata(
            current.metadata as Record<string, unknown>,
          );
        } catch (error) {
          console.error("Failed to parse interview session metadata", {
            sessionId,
            error,
            rawMetadata: current.metadata,
          });
          throw new Error(
            `Cannot update interview session with malformed metadata: ${error}`,
          );
        }
      }

      const updatedMetadata = { ...currentMetadata, ...updates };

      await db
        .update(interviewSession)
        .set({
          metadata: updatedMetadata,
        })
        .where(eq(interviewSession.id, sessionId));

      return true;
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) {
        console.error("Error in updateInterviewSessionMetadata after retries", {
          error,
          sessionId,
          attempts: MAX_RETRIES,
        });
        return false;
      }
      // Небольшая задержка перед повтором
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }

  return false;
}

/**
 * Получает количество заданных вопросов в интервью
 *
 * @param sessionId - ID сессии интервью
 * @returns Promise с количеством вопросов
 */
export async function getInterviewQuestionCount(
  sessionId: string,
): Promise<number> {
  const metadata = await getInterviewSessionMetadata(sessionId);
  return metadata.questionAnswers?.length || 0;
}
