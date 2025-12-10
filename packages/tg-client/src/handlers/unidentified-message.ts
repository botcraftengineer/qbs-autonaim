import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { and, db, eq, ilike } from "@qbs-autonaim/db";
import {
  telegramConversation,
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
      await db
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
        });

      // Обновляем chatId
      await db
        .update(vacancyResponse)
        .set({ chatId })
        .where(eq(vacancyResponse.id, response.id));

      await humanDelay(500, 1000);
      await client.sendText(
        message.chat.id,
        `Отлично${firstName ? `, ${firstName}` : ""}! Нашел тебя 👍\n\n` +
          "Теперь можем продолжить. Расскажи о себе голосовым, если удобно 🎤",
      );
      return;
    }

    // Пин-код не найден
    await client.sendText(
      message.chat.id,
      "Хм, не могу найти такой пин-код 🤔\n\n" +
        "Проверь, пожалуйста, правильно ли ты его написал. Он должен быть в сообщении, которое я отправил на hh.ru.",
    );
    return;
  }

  // Пытаемся найти вакансии по тексту сообщения
  const escapedText = escapeSqlLike(text);
  const vacancies = await db.query.vacancy.findMany({
    where: ilike(vacancy.title, `%${escapedText}%`),
    limit: 5,
  });

  if (vacancies.length === 0) {
    await client.sendText(
      message.chat.id,
      "Не могу найти такую вакансию 🤔\n\n" +
        "Напиши, пожалуйста, 4-значный пин-код из моего сообщения на hh.ru — так я точно смогу тебя найти.",
    );
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
      await db
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
        });

      // Обновляем chatId
      await db
        .update(vacancyResponse)
        .set({ chatId })
        .where(eq(vacancyResponse.id, response.id));

      await humanDelay(500, 1000);
      await client.sendText(
        message.chat.id,
        `Отлично${firstName ? `, ${firstName}` : ""}! Нашел тебя 👍\n\n` +
          `Ты откликался на "${foundVacancy.title}". Расскажи о себе голосовым, если удобно 🎤`,
      );
      return;
    }
  }

  // Если нашли несколько вакансий
  const vacancyList = vacancies
    .map((v, i) => `${i + 1}. ${v?.title}`)
    .join("\n");

  await client.sendText(
    message.chat.id,
    `Нашел несколько вакансий:\n\n${vacancyList}\n\n` +
      "Уточни, на какую именно откликался? И не забудь пин-код из сообщения на hh.ru 😊",
  );
}
