import type { Message } from "@mtcute/core";
import { and, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";

interface IdentificationResult {
  identified: boolean;
  responseId?: string;
  conversationId?: string;
  method?: "chatId" | "username" | "phone" | "pinCode";
}

/**
 * Идентифицировать кандидата по различным параметрам
 */
export async function identifyCandidate(
  message: Message,
  workspaceId: string,
): Promise<IdentificationResult> {
  const chatId = message.chat.id.toString();

  try {
    // 1. Проверка по существующей беседе (chatId)
    const existingConversation = await db.query.telegramConversation.findFirst({
      where: eq(telegramConversation.chatId, chatId),
    });

    // Беседа считается идентифицированной только если есть responseId
    if (existingConversation?.responseId) {
      return {
        identified: true,
        responseId: existingConversation.responseId,
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

    // 3. Поиск по username в vacancy_response с проверкой workspaceId
    if (username) {
      const responseByUsername = await db
        .select({
          id: vacancyResponse.id,
          candidateName: vacancyResponse.candidateName,
        })
        .from(vacancyResponse)
        .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
        .where(
          and(
            eq(vacancyResponse.telegramUsername, username),
            eq(vacancy.workspaceId, workspaceId),
          ),
        )
        .orderBy(vacancyResponse.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      if (responseByUsername) {
        // Создаем новую беседу или обновляем существующую
        const [conversation] = await db
          .insert(telegramConversation)
          .values({
            chatId,
            responseId: responseByUsername.id,
            candidateName: responseByUsername.candidateName || undefined,
            username,
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
              username,
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
      const responseByPhone = await db
        .select({
          id: vacancyResponse.id,
          candidateName: vacancyResponse.candidateName,
        })
        .from(vacancyResponse)
        .innerJoin(vacancy, eq(vacancyResponse.vacancyId, vacancy.id))
        .where(
          and(
            eq(vacancyResponse.phone, phone),
            eq(vacancy.workspaceId, workspaceId),
          ),
        )
        .orderBy(vacancyResponse.createdAt)
        .limit(1)
        .then((rows) => rows[0]);

      if (responseByPhone) {
        const [conversation] = await db
          .insert(telegramConversation)
          .values({
            chatId,
            responseId: responseByPhone.id,
            candidateName: responseByPhone.candidateName || undefined,
            username,
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
              username,
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

    // Кандидат не идентифицирован
    return { identified: false };
  } catch (error) {
    console.error("Ошибка идентификации кандидата:", error);
    return { identified: false };
  }
}
