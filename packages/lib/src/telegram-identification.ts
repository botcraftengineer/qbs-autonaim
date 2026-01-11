/**
 * Сервис идентификации кандидата в Telegram
 * Вынесен в lib для использования в tg-client и jobs без циклических зависимостей
 */

import { and, eq, ilike } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  type botSettings,
  interviewMessage,
  interviewSession,
  type vacancy,
  vacancyResponse,
  type vacancyResponseScreening,
  type workspace,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent } from "./vacancy-response-history";

interface IdentificationResult {
  success: boolean;
  chatSessionId?: string;
  responseId?: string;
  candidateName?: string;
  vacancyTitle?: string;
  error?: string;
}

interface ChatSessionData {
  responseId: string;
  candidateName?: string;
  username?: string;
  firstName?: string;
  identifiedBy: "pin_code" | "vacancy_search" | "username";
  pinCode?: string;
  searchQuery?: string;
}

/**
 * Идентифицирует кандидата по пин-коду и создает/обновляет chat session
 */
export async function identifyByPinCode(
  pinCode: string,
  chatId: string,
  workspaceId: string,
  username?: string,
  firstName?: string,
): Promise<IdentificationResult> {
  try {
    // Ищем отклик по пин-коду с проверкой workspaceId
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramPinCode, pinCode),
    });

    if (!response) {
      return {
        success: false,
        error: "Отклик не найден по указанному пин-коду",
      };
    }

    // Загружаем вакансию отдельно
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, response.vacancyId),
      columns: {
        title: true,
        id: true,
        workspaceId: true,
      },
    });

    // Проверяем, что вакансия принадлежит нужному workspace
    if (!vacancy || vacancy.workspaceId !== workspaceId) {
      return {
        success: false,
        error: "Отклик не найден по указанному пин-коду",
      };
    }

    // Создаем или обновляем chat session
    const sessionData: ChatSessionData = {
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "pin_code",
      pinCode,
    };

    const session = await createOrUpdateChatSession(sessionData);

    // Обновляем chatId и username в response
    const hadChatId = !!response.chatId;
    const hadUsername = !!response.telegramUsername;

    await db
      .update(vacancyResponse)
      .set({
        chatId: chatId,
        telegramUsername: username || response.telegramUsername,
      })
      .where(eq(vacancyResponse.id, response.id));

    if (!hadChatId) {
      await logResponseEvent({
        db,
        responseId: response.id,
        eventType: "CHAT_ID_ADDED",
        newValue: chatId,
      });
    }

    if (username && !hadUsername) {
      await logResponseEvent({
        db,
        responseId: response.id,
        eventType: "TELEGRAM_USERNAME_ADDED",
        newValue: username,
      });
    }

    return {
      success: true,
      chatSessionId: session.id,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      vacancyTitle: vacancy.title,
    };
  } catch (error) {
    console.error("Error identifying by pin code:", error);
    return {
      success: false,
      error: "Ошибка при идентификации",
    };
  }
}

/**
 * Идентифицирует кандидата по username и вакансии
 */
export async function identifyByVacancy(
  vacancyId: string,
  chatId: string,
  workspaceId: string,
  username: string,
  firstName?: string,
): Promise<IdentificationResult> {
  try {
    // Ищем отклик по username и вакансии с проверкой workspaceId
    const response = await db.query.vacancyResponse.findFirst({
      where: and(
        ilike(vacancyResponse.telegramUsername, username),
        eq(vacancyResponse.vacancyId, vacancyId),
      ),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    });

    if (!response) {
      return {
        success: false,
        error: "Отклик не найден",
      };
    }

    // Загружаем вакансию отдельно
    const vacancy = await db.query.vacancy.findFirst({
      where: (v, { eq }) => eq(v.id, response.vacancyId),
      columns: {
        title: true,
        workspaceId: true,
      },
    });

    // Проверяем, что вакансия принадлежит нужному workspace
    if (!vacancy || vacancy.workspaceId !== workspaceId) {
      return {
        success: false,
        error: "Отклик не найден",
      };
    }

    // Создаем или обновляем chat session
    const sessionData: ChatSessionData = {
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "vacancy_search",
    };

    const session = await createOrUpdateChatSession(sessionData);

    // Обновляем chatId
    await db
      .update(vacancyResponse)
      .set({ chatId })
      .where(eq(vacancyResponse.id, response.id));

    return {
      success: true,
      chatSessionId: session.id,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      vacancyTitle: vacancy.title,
    };
  } catch (error) {
    console.error("Error identifying by vacancy:", error);
    return {
      success: false,
      error: "Ошибка при идентификации",
    };
  }
}

/**
 * Создает или обновляет chat session с правильными данными
 */
async function createOrUpdateChatSession(
  data: ChatSessionData,
): Promise<{ id: string }> {
  // Проверяем, есть ли уже interview session для этого responseId
  const existing = await db.query.interviewSession.findFirst({
    where: eq(interviewSession.vacancyResponseId, data.responseId),
  });

  if (existing) {
    // Получаем существующие метаданные
    const existingMetadata: Record<string, unknown> = existing.metadata || {};

    // Объединяем с новыми данными, сохраняя существующие поля
    const updatedMetadata: Record<string, unknown> = {
      ...existingMetadata,
      identifiedBy: data.identifiedBy,
      ...(data.pinCode && { pinCode: data.pinCode }),
      ...(data.searchQuery && { searchQuery: data.searchQuery }),
      interviewStarted: true,
      candidateName: data.candidateName,
      username: data.username,
      // Сохраняем существующие questionAnswers если они есть
      questionAnswers: existingMetadata.questionAnswers || [],
    };

    // Обновляем существующую interview session
    const [updated] = await db
      .update(interviewSession)
      .set({
        status: "active",
        metadata: updatedMetadata,
      })
      .where(eq(interviewSession.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update interview session");
    }

    return updated;
  }

  // Создаем новую interview session с начальными метаданными
  const newMetadata: Record<string, unknown> = {
    identifiedBy: data.identifiedBy,
    ...(data.pinCode && { pinCode: data.pinCode }),
    ...(data.searchQuery && { searchQuery: data.searchQuery }),
    interviewStarted: true,
    candidateName: data.candidateName,
    username: data.username,
    questionAnswers: [],
  };

  const [created] = await db
    .insert(interviewSession)
    .values({
      entityType: "vacancy_response",
      vacancyResponseId: data.responseId,
      status: "active",
      metadata: newMetadata,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create interview session");
  }

  return created;
}

/**
 * Сохраняет сообщение в interview session
 */
export async function saveMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  type: "text" | "voice" = "text",
  externalId?: string,
  channel: "telegram" | "web" = "telegram",
): Promise<string | null> {
  try {
    const [message] = await db
      .insert(interviewMessage)
      .values({
        sessionId,
        role,
        type,
        content,
        externalId,
        channel,
      })
      .returning();

    return message?.id || null;
  } catch (error) {
    console.error("Error saving message:", error);
    return null;
  }
}

/**
 * Получает данные для начала интервью
 */
export async function getInterviewStartData(responseId: string): Promise<{
  response: typeof vacancyResponse.$inferSelect & {
    vacancy:
      | (typeof vacancy.$inferSelect & {
          workspace: typeof workspace.$inferSelect & {
            botSettings: typeof botSettings.$inferSelect | null;
          };
        })
      | null;
    screening: typeof vacancyResponseScreening.$inferSelect | null;
  };
} | null> {
  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
      with: {
        vacancy: {
          with: {
            workspace: {
              with: {
                botSettings: true,
              },
            },
          },
        },
        screening: true,
      },
    });

    if (!response) {
      return null;
    }

    // Возвращаем данные в правильной структуре
    return {
      response: response as typeof vacancyResponse.$inferSelect & {
        vacancy:
          | (typeof vacancy.$inferSelect & {
              workspace: typeof workspace.$inferSelect & {
                botSettings: typeof botSettings.$inferSelect | null;
              };
            })
          | null;
        screening: typeof vacancyResponseScreening.$inferSelect | null;
      },
    };
  } catch (error) {
    console.error("Error getting interview start data:", error);
    return null;
  }
}
