/**
 * Сервис идентификации кандидата в Telegram
 * Вынесен в lib для использования в tg-client и jobs без циклических зависимостей
 */

import { and, eq, ilike } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client.ws";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";

interface IdentificationResult {
  success: boolean;
  conversationId?: string;
  responseId?: string;
  candidateName?: string;
  vacancyTitle?: string;
  error?: string;
}

interface ConversationData {
  chatId: string;
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
      chatId,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "pin_code",
      pinCode,
    };

    const conversation = await createOrUpdateConversation(conversationData);

    // Обновляем chatId и username в response
    await db
      .update(vacancyResponse)
      .set({
        chatId,
        telegramUsername: username || response.telegramUsername,
      })
      .where(eq(vacancyResponse.id, response.id));

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
      chatId,
      responseId: response.id,
      candidateName: response.candidateName || firstName,
      username,
      firstName,
      identifiedBy: "vacancy_search",
    };

    const conversation = await createOrUpdateConversation(conversationData);

    // Обновляем chatId в response
    await db
      .update(vacancyResponse)
      .set({ chatId })
      .where(eq(vacancyResponse.id, response.id));

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
  const metadata = {
    identifiedBy: data.identifiedBy,
    ...(data.pinCode && { pinCode: data.pinCode }),
    ...(data.searchQuery && { searchQuery: data.searchQuery }),
    interviewStarted: true,
    questionAnswers: [],
  };

  // Проверяем, есть ли уже conversation для этого chatId
  const existing = await db.query.telegramConversation.findFirst({
    where: eq(telegramConversation.chatId, data.chatId),
  });

  if (existing) {
    // Обновляем существующую conversation
    const [updated] = await db
      .update(telegramConversation)
      .set({
        responseId: data.responseId,
        candidateName: data.candidateName,
        username: data.username,
        status: "ACTIVE",
        metadata: JSON.stringify(metadata),
      })
      .where(eq(telegramConversation.id, existing.id))
      .returning();

    if (!updated) {
      throw new Error("Failed to update conversation");
    }

    return updated;
  }

  // Создаем новую conversation
  const [created] = await db
    .insert(telegramConversation)
    .values({
      chatId: data.chatId,
      responseId: data.responseId,
      candidateName: data.candidateName,
      username: data.username,
      status: "ACTIVE",
      metadata: JSON.stringify(metadata),
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
  telegramMessageId?: string,
): Promise<string | null> {
  try {
    const [message] = await db
      .insert(telegramMessage)
      .values({
        conversationId,
        sender,
        contentType,
        content,
        telegramMessageId,
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
export async function getInterviewStartData(responseId: string) {
  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
      with: {
        vacancy: true,
        screening: true,
      },
    });

    if (!response) {
      return null;
    }

    const firstScreening = Array.isArray(response.screening)
      ? response.screening[0]
      : undefined;

    // Преобразуем requirements из jsonb в строку
    let requirementsText: string | undefined;
    if (response.vacancy?.requirements) {
      if (typeof response.vacancy.requirements === "string") {
        requirementsText = response.vacancy.requirements;
      } else if (typeof response.vacancy.requirements === "object") {
        requirementsText = JSON.stringify(response.vacancy.requirements);
      }
    }

    return {
      candidateName: response.candidateName,
      vacancyTitle: response.vacancy?.title,
      vacancyDescription: response.vacancy?.description,
      vacancyRequirements: requirementsText,
      experience: response.experience,
      coverLetter: response.coverLetter,
      phone: response.phone,
      status: response.status,
      screeningScore: firstScreening?.score,
      screeningAnalysis: firstScreening?.analysis,
      customBotInstructions: response.vacancy?.customBotInstructions,
      customInterviewQuestions: response.vacancy?.customInterviewQuestions,
      customOrganizationalQuestions:
        response.vacancy?.customOrganizationalQuestions,
    };
  } catch (error) {
    console.error("Error getting interview start data:", error);
    return null;
  }
}
