import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  companySettings,
  telegramConversation,
  telegramMessage,
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

export async function createOrUpdateTempConversation(
  chatId: string,
  username?: string,
  firstName?: string,
) {
  const updateSet: Record<string, string | undefined> = {};
  if (username !== undefined) updateSet.username = username;
  if (firstName !== undefined) updateSet.candidateName = firstName;

  const [conv] = await db
    .insert(telegramConversation)
    .values({
      chatId,
      candidateName: firstName,
      username,
      status: "ACTIVE",
      metadata: JSON.stringify({
        identifiedBy: "none",
        awaitingPin: true,
      }),
    })
    .onConflictDoUpdate({
      target: telegramConversation.chatId,
      set: updateSet,
    })
    .returning();

  return conv;
}
