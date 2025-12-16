import { db } from "@qbs-autonaim/db/client";
import { telegramConversation } from "@qbs-autonaim/db/schema";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { saveUnidentifiedMessage } from "./save-message";

export async function handleUnidentifiedMedia(params: {
  chatId: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const { chatId, messageId, username, firstName, workspaceId, botSettings } =
    params;

  let tempConv: typeof telegramConversation.$inferSelect | undefined;
  try {
    const result = await db
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
      .onConflictDoNothing()
      .returning();

    tempConv = result[0];
  } catch (error) {
    console.error("Failed to create temp conversation for media:", {
      chatId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (tempConv) {
    await saveUnidentifiedMessage({
      conversationId: tempConv.id,
      content: "Голосовое сообщение (кандидат не идентифицирован)",
      messageId,
      contentType: "VOICE",
    });

    await generateAndSendBotResponse({
      conversationId: tempConv.id,
      messageText: "[Голосовое сообщение]",
      stage: "AWAITING_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
    });
  }

  return { processed: true, identified: false };
}
