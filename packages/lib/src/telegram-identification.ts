/**
 * Сервис идентификации кандидата в Telegram
 * Вынесен в lib для использования в tg-client и jobs без циклических зависимостей
 */

import { and, eq, ilike } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  type companySettings,
  conversation,
  conversationMessage,
  type responseScreening,
  type vacancy,
  vacancyResponse,
  type workspace,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent } from "./vacancy-response-history";

interface IdentificationResult {
  success: boolean;
  conversationId?: string;
  responseId?: string;
  candidateName?: string;
  vacancyTitle?: string;
  error?: string;
}

interface ConversationData {
  responseId: string;
  candidateName?: string;
  username?: string;
  firstName?: string;
  identifiedBy: "pin_code" | "vacancy_search" | "username";
  pinCode?: string;
  searchQuery?: string;
}

/**
 * Идентифицирует кандидата по пин-коду и создает/обновляет conversation
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
      with: {
        vacancy: {
          columns: {
            title: true,
            id: true,
            workspaceId: true,
          },
        },
      },
    });

    // Проверяем, что вакансия принадлежит нужному workspace
    if (response && response.vacancy?.workspaceId !== workspaceId) {
      return {
        success: false,
        error: "Отклик не найден по указанному пин-коду",
      };
    }
    if (!response) {
      return {
        success: false,
        error: "Отклик не найден по указанному пин-коду",
      };
    }

    // Создаем или обновляем conversation
    const conversationData: ConversationData = {
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "pin_code",
      pinCode,
    };

    const conversation = await createOrUpdateConversation(conversationData);

    // Обновляем chatId и username в response
    const hadChatId = !!response.chatId;
    const hadUsername = !!response.telegramUsername;

    await db
      .update(vacancyResponse)
      .set({
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
      conversationId: conversation.id,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      vacancyTitle: response.vacancy?.title,
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
  _chatId: string,
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
      with: {
        vacancy: true,
      },
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    });

    // Проверяем, что вакансия принадлежит нужному workspace
    if (response && response.vacancy?.workspaceId !== workspaceId) {
      return {
        success: false,
        error: "Отклик не найден",
      };
    }

    if (!response) {
      return {
        success: false,
        error: "Отклик не найден",
      };
    }

    // Создаем или обновляем conversation
    const conversationData: ConversationData = {
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "vacancy_search",
    };

    const conversation = await createOrUpdateConversation(conversationData);

    return {
      success: true,
      conversationId: conversation.id,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      vacancyTitle: response.vacancy?.title,
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
 * Создает или обновляет conversation с правильными данными
 */
async function createOrUpdateConversation(
  data: ConversationData,
): Promise<{ id: string }> {
  // Проверяем, есть ли уже conversation для этого responseId
  const existing = await db.query.conversation.findFirst({
    where: eq(conversation.responseId, data.responseId),
  });

  if (existing) {
    // Получаем существующие метаданные
    const existingMetadata: Record<string, unknown> = existing.metadata || {};

    // Объединяем с новыми данными, сохраняя существующие поля
    const updatedMetadata = {
      ...existingMetadata,
      identifiedBy: data.identifiedBy,
      ...(data.pinCode && { pinCode: data.pinCode }),
      ...(data.searchQuery && { searchQuery: data.searchQuery }),
      interviewStarted: true,
      // Сохраняем существующие questionAnswers если они есть
      questionAnswers: existingMetadata.questionAnswers || [],
    };

    // Обновляем существующую conversation
    const [updated] = await db
      .update(conversation)
      .set({
        candidateName: data.candidateName,
        username: data.username,
        status: "ACTIVE",
        metadata: updatedMetadata,
      })
      .where(eq(conversation.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update conversation");
    }

    return updated;
  }

  // Создаем новую conversation с начальными метаданными
  const newMetadata = {
    identifiedBy: data.identifiedBy,
    ...(data.pinCode && { pinCode: data.pinCode }),
    ...(data.searchQuery && { searchQuery: data.searchQuery }),
    interviewStarted: true,
    questionAnswers: [],
  };

  const [created] = await db
    .insert(conversation)
    .values({
      responseId: data.responseId,
      candidateName: data.candidateName,
      username: data.username,
      status: "ACTIVE",
      metadata: newMetadata,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to create conversation");
  }

  return created;
}

/**
 * Сохраняет сообщение в conversation
 */
export async function saveMessage(
  conversationId: string,
  sender: "CANDIDATE" | "BOT",
  content: string,
  contentType: "TEXT" | "VOICE" = "TEXT",
  externalMessageId?: string,
): Promise<string | null> {
  try {
    const [message] = await db
      .insert(conversationMessage)
      .values({
        conversationId,
        sender,
        contentType,
        content,
        externalMessageId,
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
            companySettings: typeof companySettings.$inferSelect | null;
          };
        })
      | null;
    screening: typeof responseScreening.$inferSelect | null;
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
                companySettings: true,
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
      response,
    };
  } catch (error) {
    console.error("Error getting interview start data:", error);
    return null;
  }
}
