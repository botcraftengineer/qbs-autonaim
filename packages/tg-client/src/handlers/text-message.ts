import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { generateAIResponse } from "../utils/ai-response";
import { triggerMessageSend } from "../utils/inngest";
import { getChatHistory, markRead } from "../utils/telegram";
import { handleUnidentifiedMessage } from "./unidentified-message";

export async function handleTextMessage(
  client: TelegramClient,
  message: Message,
  workspaceId: string,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const messageText = message.text || "";

  try {
    const [conversation] = await db
      .select()
      .from(telegramConversation)
      .where(eq(telegramConversation.chatId, chatId))
      .limit(1);

    // Если беседа не найдена или пользователь не идентифицирован (нет responseId),
    // перенаправляем в handleUnidentifiedMessage для попытки идентификации
    if (!conversation || !conversation.responseId) {
      await handleUnidentifiedMessage(client, message, workspaceId);
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
    let vacancyRequirements: string | undefined;
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

      // Преобразуем requirements из jsonb в строку
      if (response?.vacancy?.requirements) {
        if (typeof response.vacancy.requirements === "string") {
          vacancyRequirements = response.vacancy.requirements;
        } else if (typeof response.vacancy.requirements === "object") {
          vacancyRequirements = JSON.stringify(response.vacancy.requirements);
        }
      }

      if (response) {
        resumeData = {
          experience: response.experience || undefined,
          coverLetter: response.coverLetter || undefined,
          phone: response.phone || undefined,
        };
      }
    }

    // Генерируем ответ через AI
    const aiResponse = await generateAIResponse({
      messageText,
      stage: "INTERVIEWING",
      candidateName: conversation.candidateName || undefined,
      vacancyTitle,
      vacancyRequirements,
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

    if (botMessage && conversation.username) {
      await triggerMessageSend(
        botMessage.id,
        conversation.username,
        aiResponse,
        workspaceId,
      );
    }
  } catch (error) {
    console.error("Ошибка при обработке текстового сообщения:", error);
    // Молчим при ошибках - не показываем пользователю технические проблемы
  }
}
