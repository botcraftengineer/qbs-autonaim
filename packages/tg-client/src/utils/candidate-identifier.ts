import type { Message } from "@mtcute/core";
import { db, eq, or } from "@qbs-autonaim/db";
import { telegramConversation, vacancyResponse } from "@qbs-autonaim/db/schema";

interface IdentificationResult {
  identified: boolean;
  responseId?: string;
  conversationId?: string;
  method?: "chatId" | "username" | "phone" | "token";
}

/**
 * Идентифицировать кандидата по различным параметрам
 */
export async function identifyCandidate(
  message: Message,
): Promise<IdentificationResult> {
  const chatId = message.chat.id.toString();

  try {
    // 1. Проверка по существующей беседе (chatId)
    const existingConversation = await db.query.telegramConversation.findFirst({
      where: eq(telegramConversation.chatId, chatId),
    });

    if (existingConversation) {
      return {
        identified: true,
        responseId: existingConversation.responseId || undefined,
        conversationId: existingConversation.id,
        method: "chatId",
      };
    }

    // 2. Получение username отправителя
    const sender = message.sender;
    let username: string | undefined;

    if (sender && "username" in sender && sender.username) {
      username = sender.username;
    }

    // 3. Поиск по username в vacancy_response
    if (username) {
      const responseByUsername = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.telegramUsername, username),
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      });

      if (responseByUsername) {
        // Создаем новую беседу или обновляем существующую
        const [conversation] = await db
          .insert(telegramConversation)
          .values({
            chatId,
            responseId: responseByUsername.id,
            candidateName: responseByUsername.candidateName || undefined,
            status: "ACTIVE",
            metadata: JSON.stringify({
              identifiedBy: "username",
              username,
            }),
          })
          .onConflictDoUpdate({
            target: telegramConversation.chatId,
            set: {
              responseId: responseByUsername.id,
              candidateName: responseByUsername.candidateName || undefined,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "username",
                username,
              }),
            },
          })
          .returning();

        return {
          identified: true,
          responseId: responseByUsername.id,
          conversationId: conversation?.id,
          method: "username",
        };
      }
    }

    // 4. Поиск по номеру телефона (если доступен)
    // Telegram не всегда предоставляет номер телефона, но можно попробовать
    const phone =
      sender && "phone" in sender && typeof sender.phone === "string"
        ? sender.phone
        : undefined;

    if (phone) {
      const responseByPhone = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.phone, phone),
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      });

      if (responseByPhone) {
        const [conversation] = await db
          .insert(telegramConversation)
          .values({
            chatId,
            responseId: responseByPhone.id,
            candidateName: responseByPhone.candidateName || undefined,
            status: "ACTIVE",
            metadata: JSON.stringify({
              identifiedBy: "phone",
              phone,
            }),
          })
          .onConflictDoUpdate({
            target: telegramConversation.chatId,
            set: {
              responseId: responseByPhone.id,
              candidateName: responseByPhone.candidateName || undefined,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "phone",
                phone,
              }),
            },
          })
          .returning();

        return {
          identified: true,
          responseId: responseByPhone.id,
          conversationId: conversation?.id,
          method: "phone",
        };
      }
    }

    // 5. Проверка, может быть в тексте есть токен
    const text = message.text?.trim();
    if (text && text.length === 32) {
      // Токен - это 32 hex символа
      const responseByToken = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.telegramInviteToken, text),
      });

      if (responseByToken) {
        const [conversation] = await db
          .insert(telegramConversation)
          .values({
            chatId,
            responseId: responseByToken.id,
            candidateName: responseByToken.candidateName || undefined,
            status: "ACTIVE",
            metadata: JSON.stringify({
              identifiedBy: "token",
              token: `${text.slice(0, 8)}...`,
            }),
          })
          .onConflictDoUpdate({
            target: telegramConversation.chatId,
            set: {
              responseId: responseByToken.id,
              candidateName: responseByToken.candidateName || undefined,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "token",
                token: `${text.slice(0, 8)}...`,
              }),
            },
          })
          .returning();

        // Обновляем chatId в vacancy_response
        await db
          .update(vacancyResponse)
          .set({ chatId })
          .where(eq(vacancyResponse.id, responseByToken.id));

        // Не отправляем сообщение здесь - пусть основной обработчик продолжит диалог естественно

        return {
          identified: true,
          responseId: responseByToken.id,
          conversationId: conversation?.id,
          method: "token",
        };
      }
    }

    // Кандидат не идентифицирован
    return { identified: false };
  } catch (error) {
    console.error("Ошибка идентификации кандидата:", error);
    return { identified: false };
  }
}

/**
 * Связать существующую беседу с откликом по токену
 */
export async function linkConversationByToken(
  chatId: string,
  token: string,
): Promise<IdentificationResult> {
  try {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramInviteToken, token),
    });

    if (!response) {
      return { identified: false };
    }

    // Проверяем, нет ли уже беседы
    const existingConversation = await db.query.telegramConversation.findFirst({
      where: or(
        eq(telegramConversation.chatId, chatId),
        eq(telegramConversation.responseId, response.id),
      ),
    });

    if (existingConversation) {
      // Обновляем chatId если нужно
      if (existingConversation.chatId !== chatId) {
        await db
          .update(telegramConversation)
          .set({ chatId })
          .where(eq(telegramConversation.id, existingConversation.id));
      }

      return {
        identified: true,
        responseId: response.id,
        conversationId: existingConversation.id,
        method: "token",
      };
    }

    // Создаем новую беседу или обновляем существующую
    const [conversation] = await db
      .insert(telegramConversation)
      .values({
        chatId,
        responseId: response.id,
        candidateName: response.candidateName || undefined,
        status: "ACTIVE",
        metadata: JSON.stringify({
          identifiedBy: "token",
          token: `${token.slice(0, 8)}...`,
        }),
      })
      .onConflictDoUpdate({
        target: telegramConversation.chatId,
        set: {
          responseId: response.id,
          candidateName: response.candidateName || undefined,
          status: "ACTIVE",
          metadata: JSON.stringify({
            identifiedBy: "token",
            token: `${token.slice(0, 8)}...`,
          }),
        },
      })
      .returning();

    // Обновляем chatId в vacancy_response
    await db
      .update(vacancyResponse)
      .set({ chatId })
      .where(eq(vacancyResponse.id, response.id));

    return {
      identified: true,
      responseId: response.id,
      conversationId: conversation?.id,
      method: "token",
    };
  } catch (error) {
    console.error("Ошибка связывания беседы по токену:", error);
    return { identified: false };
  }
}
