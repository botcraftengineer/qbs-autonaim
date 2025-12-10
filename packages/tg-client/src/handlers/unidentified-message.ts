import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { and, db, eq, ilike } from "@qbs-autonaim/db";
import {
  telegramConversation,
  telegramMessage,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { humanDelay } from "../utils/delays.js";
import { markRead, showTyping } from "../utils/telegram.js";

function escapeSqlLike(text: string): string {
  return text.replace(/[\\%_]/g, "\\$&");
}

/**
 * Извлекает 4-значный пин-код из текста
 */
function extractPinCode(text: string): string | null {
  // Ищем 4 цифры подряд
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

export async function handleUnidentifiedMessage(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const text = message.text?.trim();

  if (!text) {
    return;
  }

  await markRead(client, message.chat.id);
  await showTyping(client, message.chat.id);
  await humanDelay(1500, 2500);

  const sender = message.sender;
  let username: string | undefined;
  let firstName: string | undefined;

  if (sender && "username" in sender && sender.username) {
    username = sender.username;
  }

  if (sender?.type === "user") {
    firstName = sender.firstName || undefined;
  }

  // Сначала пытаемся найти пин-код в сообщении
  const pinCode = extractPinCode(text);

  if (pinCode) {
    // Ищем отклик по пин-коду
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.telegramPinCode, pinCode),
      with: {
        vacancy: true,
      },
    });

    if (response) {
      // Создаем беседу
      const [conversation] = await db
        .insert(telegramConversation)
        .values({
          chatId,
          responseId: response.id,
          candidateName: response.candidateName || firstName || undefined,
          status: "ACTIVE",
          metadata: JSON.stringify({
            identifiedBy: "pin_code",
            pinCode,
          }),
        })
        .onConflictDoUpdate({
          target: telegramConversation.chatId,
          set: {
            responseId: response.id,
            status: "ACTIVE",
          },
        })
        .returning();

      // Обновляем chatId
      await db
        .update(vacancyResponse)
        .set({ chatId })
        .where(eq(vacancyResponse.id, response.id));

      // Сохраняем сообщение кандидата
      if (conversation) {
        await db.insert(telegramMessage).values({
          conversationId: conversation.id,
          sender: "CANDIDATE",
          contentType: "TEXT",
          content: text,
          telegramMessageId: message.id.toString(),
        });
      }

      // После идентификации по PIN начинаем интервью
      const { generateAIResponse } = await import("../utils/ai-response.js");

      const resumeData = {
        experience: response.experience || undefined,
        coverLetter: response.coverLetter || undefined,
        phone: response.phone || undefined,
      };

      const aiResponse = await generateAIResponse({
        messageText: text,
        stage: "PIN_RECEIVED",
        candidateName: response.candidateName || firstName,
        vacancyTitle: response.vacancy?.title,
        responseStatus: response.status,
        resumeData,
      });

      await humanDelay(500, 1000);
      await client.sendText(message.chat.id, aiResponse);

      // Сохраняем ответ бота
      if (conversation) {
        await db.insert(telegramMessage).values({
          conversationId: conversation.id,
          sender: "BOT",
          contentType: "TEXT",
          content: aiResponse,
        });
      }

      return;
    }
  }

  // Пытаемся найти вакансии по тексту сообщения
  const escapedText = escapeSqlLike(text);
  const vacancies = await db.query.vacancy.findMany({
    where: ilike(vacancy.title, `%${escapedText}%`),
    limit: 5,
  });

  if (vacancies.length === 0) {
    // Вакансии не найдены - запрашиваем PIN
    const { generateAIResponse } = await import("../utils/ai-response.js");

    const aiResponse = await generateAIResponse({
      messageText: text,
      stage: "AWAITING_PIN",
      candidateName: firstName,
    });

    await client.sendText(message.chat.id, aiResponse);
    return;
  }

  // Если нашли одну вакансию, пытаемся найти отклик кандидата
  if (vacancies.length === 1) {
    const foundVacancy = vacancies[0];

    if (!foundVacancy) return;

    // Ищем отклик только если есть username, чтобы не привязать чужой отклик
    let response = null;
    if (username) {
      response = await db.query.vacancyResponse.findFirst({
        where: and(
          ilike(vacancyResponse.telegramUsername, username),
          eq(vacancyResponse.vacancyId, foundVacancy.id),
        ),
        orderBy: (fields, { desc }) => [desc(fields.createdAt)],
      });
    }

    if (response) {
      // Создаем беседу
      const [conversation] = await db
        .insert(telegramConversation)
        .values({
          chatId,
          responseId: response.id,
          candidateName: response.candidateName || firstName || undefined,
          status: "ACTIVE",
          metadata: JSON.stringify({
            identifiedBy: "vacancy_search",
            searchQuery: text,
          }),
        })
        .onConflictDoUpdate({
          target: telegramConversation.chatId,
          set: {
            responseId: response.id,
            status: "ACTIVE",
          },
        })
        .returning();

      // Обновляем chatId
      await db
        .update(vacancyResponse)
        .set({ chatId })
        .where(eq(vacancyResponse.id, response.id));

      // Сохраняем сообщение кандидата
      if (conversation) {
        await db.insert(telegramMessage).values({
          conversationId: conversation.id,
          sender: "CANDIDATE",
          contentType: "TEXT",
          content: text,
          telegramMessageId: message.id.toString(),
        });
      }

      // После идентификации по вакансии начинаем интервью
      const { generateAIResponse } = await import("../utils/ai-response.js");

      const resumeData = {
        experience: response.experience || undefined,
        coverLetter: response.coverLetter || undefined,
        phone: response.phone || undefined,
      };

      const aiResponse = await generateAIResponse({
        messageText: text,
        stage: "PIN_RECEIVED",
        candidateName: response.candidateName || firstName,
        vacancyTitle: foundVacancy.title,
        responseStatus: response.status,
        resumeData,
      });

      await humanDelay(500, 1000);
      await client.sendText(message.chat.id, aiResponse);

      // Сохраняем ответ бота
      if (conversation) {
        await db.insert(telegramMessage).values({
          conversationId: conversation.id,
          sender: "BOT",
          contentType: "TEXT",
          content: aiResponse,
        });
      }

      return;
    }
  }

  // Если нашли несколько вакансий - запрашиваем PIN
  const { generateAIResponse } = await import("../utils/ai-response.js");

  const vacancyList = vacancies.map((v) => v?.title).join(", ");

  const aiResponse = await generateAIResponse({
    messageText: `${text}\n\nНайденные вакансии: ${vacancyList}`,
    stage: "AWAITING_PIN",
    candidateName: firstName,
  });

  await client.sendText(message.chat.id, aiResponse);
}
