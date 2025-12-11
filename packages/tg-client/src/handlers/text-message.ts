import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { getTextErrorResponse } from "../responses/greetings.js";
import { humanDelay } from "../utils/delays.js";
import {
  triggerMessageSend,
  triggerUnidentifiedMessageSend,
} from "../utils/inngest.js";
import { getChatHistory, markRead, showTyping } from "../utils/telegram.js";

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

      // Кандидат не идентифицирован - запрашиваем PIN
      // Получаем контекст из чата через mtcute (не сохраняем в БД)
      const conversationHistory = await getChatHistory(
        client,
        message.chat.id,
        10,
      );
      const { generateAIResponse } = await import("../utils/ai-response.js");

      const aiResponse = await generateAIResponse({
        messageText,
        stage: "AWAITING_PIN",
        conversationHistory,
      });

      // Получаем username из сообщения
      const username =
        message.sender?.username ||
        (message.sender && "username" in message.sender
          ? (message.sender as { username?: string }).username
          : undefined);

      if (!username) {
        console.warn(
          "⚠️ Не удалось получить username для неидентифицированного пользователя",
        );
        return;
      }

      // Отправляем сообщение через inngest без сохранения в БД
      await humanDelay(600, 1200);
      await triggerUnidentifiedMessageSend(username, aiResponse);

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
    // Сначала пытаемся получить из БД
    const history = await db
      .select()
      .from(telegramMessage)
      .where(eq(telegramMessage.conversationId, conversation.id))
      .orderBy(desc(telegramMessage.createdAt))
      .limit(10);

    let conversationHistory = history.reverse().map((msg) => ({
      sender: msg.sender,
      content: msg.content || "",
    }));

    // Если в БД мало сообщений, дополняем из чата через mtcute
    if (conversationHistory.length < 3) {
      const chatHistory = await getChatHistory(client, message.chat.id, 10);
      conversationHistory = chatHistory;
    }

    // Получаем информацию о вакансии и статусе
    let response = null;
    let vacancyTitle: string | undefined;
    let resumeData:
      | {
          experience?: string;
          coverLetter?: string;
          phone?: string;
        }
      | undefined;

    if (conversation.responseId) {
      response = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, conversation.responseId),
        with: {
          vacancy: true,
        },
      });

      vacancyTitle = response?.vacancy?.title;

      if (response) {
        resumeData = {
          experience: response.experience || undefined,
          coverLetter: response.coverLetter || undefined,
          phone: response.phone || undefined,
        };
      }
    }

    // Генерируем ответ через AI
    const { generateAIResponse } = await import("../utils/ai-response.js");

    const aiResponse = await generateAIResponse({
      messageText,
      stage: "INTERVIEWING",
      candidateName: conversation.candidateName || undefined,
      vacancyTitle,
      responseStatus: response?.status,
      conversationHistory,
      resumeData,
    });

    // Сохраняем ответ бота
    const [botMessage] = await db
      .insert(telegramMessage)
      .values({
        conversationId: conversation.id,
        sender: "BOT",
        contentType: "TEXT",
        content: aiResponse,
      })
      .returning();

    if (botMessage) {
      await triggerMessageSend(botMessage.id, chatId, aiResponse);
    }
  } catch (error) {
    console.error("Ошибка при обработке текстового сообщения:", error);

    try {
      const [conversation] = await db
        .select()
        .from(telegramConversation)
        .where(eq(telegramConversation.chatId, chatId))
        .limit(1);

      if (conversation) {
        const errorMessage = getTextErrorResponse();
        const [botMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "BOT",
            contentType: "TEXT",
            content: errorMessage,
          })
          .returning();

        if (botMessage) {
          await humanDelay(800, 1500);
          await triggerMessageSend(botMessage.id, chatId, errorMessage);
        }
      }
    } catch (sendError) {
      console.error("Не удалось отправить сообщение об ошибке:", sendError);
    }
  }
}
