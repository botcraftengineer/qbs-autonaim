import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import {
  getCompletedResponse,
  getGeneralResponse,
  getInterviewResponse,
  getOtherStatusResponse,
} from "../responses/greetings.js";
import { humanDelay } from "../utils/delays.js";
import { markRead, showTyping } from "../utils/telegram.js";

export async function handleTextMessage(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const messageText = message.text || "";

  const [conversation] = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.chatId, chatId))
    .limit(1);

  if (!conversation) {
    await markRead(client, message.chat.id);
    await humanDelay(600, 1200);
    await client.sendText(
      message.chat.id,
      "Привет! А мы знакомы? Напомни, пожалуйста, откуда ты 😊",
    );
    return;
  }

  await markRead(client, message.chat.id);

  await db.insert(telegramMessage).values({
    conversationId: conversation.id,
    sender: "CANDIDATE",
    contentType: "TEXT",
    content: messageText,
    telegramMessageId: message.id.toString(),
  });

  await showTyping(client, message.chat.id);

  const readingTime = Math.min(messageText.length * 30, 2000);
  await humanDelay(readingTime, readingTime + 1000);

  let responseText: string;

  if (conversation.responseId) {
    const [response] = await db
      .select()
      .from(vacancyResponse)
      .where(eq(vacancyResponse.id, conversation.responseId))
      .limit(1);

    if (response) {
      if (response.status === "COMPLETED") {
        responseText = getCompletedResponse();
      } else if (response.status === "INTERVIEW_HH") {
        responseText = getInterviewResponse();
      } else {
        responseText = getOtherStatusResponse();
      }
    } else {
      responseText = getGeneralResponse();
    }
  } else {
    responseText = getGeneralResponse();
  }

  await client.sendText(message.chat.id, responseText);
}
