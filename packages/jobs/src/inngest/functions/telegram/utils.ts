import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  companySettings,
  conversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import type { BotSettings } from "./types";

export function extractPinCode(text: string): string | null {
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

export async function findDuplicateMessage(
  conversationId: string,
  telegramMessageId: string,
): Promise<boolean> {
  const existingMessage = await db.query.telegramMessage.findFirst({
    where: (messages, { and, eq }) =>
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.telegramMessageId, telegramMessageId),
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
  return await db.query.telegramMessage.findMany({
    where: eq(telegramMessage.conversationId, conversationId),
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
