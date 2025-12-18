import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  companySettings,
  conversationMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import type { BotSettings } from "./types";

export function extractPinCode(text: string): string | null {
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

export async function findDuplicateMessage(
  conversationId: string,
  externalMessageId: string,
): Promise<boolean> {
  const existingMessage = await db.query.conversationMessage.findFirst({
    where: (messages, { and, eq }) =>
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.externalMessageId, externalMessageId),
      ),
  });
  return !!existingMessage;
}

export async function getCompanyBotSettings(
  workspaceId: string,
): Promise<BotSettings> {
  try {
    const company = await db.query.companySettings.findFirst({
      where: eq(companySettings.workspaceId, workspaceId),
    });
    return {
      botName: company?.botName ?? "Дмитрий",
      botRole: company?.botRole ?? "рекрутер",
    };
  } catch (error) {
    console.error(
      "❌ Ошибка загрузки настроек бота, используем значения по умолчанию",
      {
        workspaceId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      botName: "Дмитрий",
      botRole: "рекрутер",
    };
  }
}

export async function getConversationHistory(conversationId: string) {
  // Для временных conversation ID возвращаем пустую историю
  // Сообщения будут доступны после идентификации пользователя
  if (conversationId.startsWith("temp_")) {
    return [];
  }

  return await db.query.conversationMessage.findMany({
    where: eq(conversationMessage.conversationId, conversationId),
    orderBy: (messages, { asc }) => [asc(messages.createdAt)],
    limit: 10,
  });
}

/**
 * Находит conversation по chatId через связь с vacancyResponse
 */
export async function findConversationByChatId(chatId: string) {
  return await db.query.conversation.findFirst({
    where: (fields, { inArray }) => {
      return inArray(
        fields.responseId,
        db
          .select({ id: vacancyResponse.id })
          .from(vacancyResponse)
          .where(eq(vacancyResponse.chatId, chatId)),
      );
    },
    with: {
      response: {
        with: {
          vacancy: true,
        },
      },
    },
  });
}

/**
 * Создает или возвращает временный ID для неидентифицированного пользователя
 * Используется для хранения сообщений до идентификации по пин-коду
 *
 * ВАЖНО: Возвращает chatId как временный ID, так как conversation
 * требует обязательный responseId, который мы не можем создать без вакансии.
 * Сообщения будут храниться с этим временным ID до идентификации.
 */
export async function createOrUpdateTempConversation(
  chatId: string,
  _username?: string,
  _firstName?: string,
): Promise<{ id: string } | null> {
  try {
    // Используем chatId как временный ID для неидентифицированных разговоров
    // Это позволяет сохранять сообщения до идентификации пользователя
    return { id: `temp_${chatId}` };
  } catch (error) {
    console.error("Ошибка создания временного ID:", {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
