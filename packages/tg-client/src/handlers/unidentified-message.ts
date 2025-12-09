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

  if (sender && "username" in sender && sender.username) {
    username = sender.username;
  }

  // Пытаемся найти вакансии по тексту сообщения
  const escapedText = escapeSqlLike(text);
  const vacancies = await db.query.vacancy.findMany({
    where: ilike(vacancy.title, `%${escapedText}%`),
    limit: 5,
  });

  if (vacancies.length === 0) {
    await client.sendText(
      chatId,
      "Хм, не могу найти такую вакансию 🤔\n\n" +
        "Попробуйте написать название точнее, или перейдите по ссылке из моего сообщения в HH.ru — так я точно смогу вас идентифицировать.\n\n" +
        "Также можете просто рассказать, чем вы занимаетесь и что ищете — обсудим!",
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
          candidateName: response.candidateName || undefined,
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

      await client.sendText(
        chatId,
        `Отлично, нашел! Вы откликались на вакансию "${foundVacancy.title}" 👍\n\n` +
          "Теперь можем продолжить общение. Расскажите о себе или задайте вопросы по вакансии!",
      );
      return;
    }
  }

  // Если нашли несколько вакансий
  const vacancyList = vacancies
    .map((v, i) => `${i + 1}. ${v?.title}`)
    .join("\n");

  await client.sendText(
    chatId,
    `Нашел несколько подходящих вакансий:\n\n${vacancyList}\n\n` +
      "Уточните, пожалуйста, на какую именно вы откликались? Или перейдите по ссылке из моего сообщения в HH.ru.",
  );
}
