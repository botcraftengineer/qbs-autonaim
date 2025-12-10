import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { getErrorResponse } from "../responses/greetings.js";
import { humanDelay } from "../utils/delays.js";
import { markRead, showTyping } from "../utils/telegram.js";

export async function handleTextMessage(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const messageText = message.text || "";

  try {
    const [conversation] = await db
      .select()
      .from(telegramConversation)
      .where(eq(telegramConversation.chatId, chatId))
      .limit(1);

    if (!conversation) {
      await markRead(client, message.chat.id);

      // Используем AI для ответа неидентифицированному пользователю
      const { generateAIResponse } = await import("../utils/ai-response.js");

      const aiResponse = await generateAIResponse({
        messageText,
      });

      await humanDelay(600, 1200);
      await client.sendText(message.chat.id, aiResponse);
      return;
    }

    await markRead(client, message.chat.id);

    // Сохраняем сообщение кандидата
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

    // Получаем историю переписки для контекста
    const history = await db
      .select()
      .from(telegramMessage)
      .where(eq(telegramMessage.conversationId, conversation.id))
      .orderBy(desc(telegramMessage.createdAt))
      .limit(10);

    const conversationHistory = history.reverse().map((msg) => ({
      sender: msg.sender,
      content: msg.content || "",
    }));

    // Получаем информацию о вакансии и статусе
    let response = null;
    let vacancyTitle: string | undefined;

    if (conversation.responseId) {
      response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, conversation.responseId),
        with: {
          vacancy: true,
        },
      });

      vacancyTitle = response?.vacancy?.title;
    }

    // Генерируем ответ через AI
    const { generateAIResponse } = await import("../utils/ai-response.js");

    const aiResponse = await generateAIResponse({
      messageText,
      candidateName: conversation.candidateName || undefined,
      vacancyTitle,
      responseStatus: response?.status,
      conversationHistory,
    });

    await client.sendText(message.chat.id, aiResponse);

    // Сохраняем ответ бота
    await db.insert(telegramMessage).values({
      conversationId: conversation.id,
      sender: "BOT",
      contentType: "TEXT",
      content: aiResponse,
    });
  } catch (error) {
    console.error("Ошибка при обработке текстового сообщения:", error);

    try {
      await humanDelay(800, 1500);
      await client.sendText(message.chat.id, getErrorResponse());
    } catch (sendError) {
      console.error("Не удалось отправить сообщение об ошибке:", sendError);
    }
  }
}
