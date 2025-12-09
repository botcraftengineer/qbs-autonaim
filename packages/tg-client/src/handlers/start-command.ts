import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { db } from "@qbs-autonaim/db/client";
import { telegramConversation } from "@qbs-autonaim/db/schema";
import {
  getGenericGreeting,
  getPersonalizedGreeting,
} from "../responses/greetings.js";
import { humanDelay } from "../utils/delays.js";
import { markRead, showTyping } from "../utils/telegram.js";

export async function handleStartCommand(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const sender = message.sender;

  let username: string | undefined;
  let firstName: string | undefined;

  if (sender?.type === "user") {
    username = sender.username || undefined;
    firstName = sender.firstName || undefined;
  }

  const messageText = message.text || "";
  const startPayload = messageText.replace("/start", "").trim();

  console.log("🆔 Telegram Chat Info:", {
    chatId,
    username: username ? `@${username}` : "no username",
    firstName,
    startPayload: startPayload || "none",
  });

  let responseId: string | null = null;
  let candidateName = firstName;

  if (startPayload) {
    try {
      const { findResponseByInviteToken } = await import("@qbs-autonaim/jobs");
      const responseResult = await findResponseByInviteToken(startPayload);

      if (responseResult.success) {
        responseId = responseResult.data.id;
        candidateName = responseResult.data.candidateName || candidateName;

        console.log("✅ Linked conversation to response", {
          chatId,
          responseId,
          candidateName,
        });
      } else {
        console.warn("⚠️ Invalid invite token", { token: startPayload });
      }
    } catch (error) {
      console.error("❌ Error processing invite token", {
        error,
        startPayload,
      });
    }
  }

  await db
    .insert(telegramConversation)
    .values({
      chatId,
      responseId: responseId || undefined,
      candidateName,
      status: "ACTIVE",
    })
    .onConflictDoUpdate({
      target: telegramConversation.chatId,
      set: {
        status: "ACTIVE",
        ...(responseId && { responseId }),
        ...(candidateName && { candidateName }),
      },
    })
    .returning();

  await markRead(client, message.chat.id);
  await showTyping(client, message.chat.id);
  await humanDelay(1500, 3000);

  const greeting = responseId
    ? getPersonalizedGreeting(candidateName)
    : getGenericGreeting(firstName);

  await client.sendText(message.chat.id, greeting);
}
