import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { and, db, eq, ilike } from "@qbs-autonaim/db";
import {
  telegramConversation,
  telegramMessage,
  vacancy,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import {
  getInterviewStartData,
  identifyByPinCode,
  identifyByVacancy,
  saveMessage,
} from "@qbs-autonaim/lib";
import { generateAIResponse } from "../utils/ai-response";
import { triggerMessageSend } from "../utils/inngest";
import { getChatHistory, markRead } from "../utils/telegram";

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
  workspaceId: string,
): Promise<void> {
  const chatId = message.chat.id.toString();
  const text = message.text?.trim();

  if (!text) {
    return;
  }

  await markRead(client, message.chat.id);

  const sender = message.sender;
  let username: string | undefined;
  let firstName: string | undefined;
  if (sender && "username" in sender && sender.username) {
    username = sender.username;
  }
  if (sender?.type === "user") {
    firstName = sender.firstName || undefined;
  }

  // Создаем или получаем временную беседу для неидентифицированного пользователя
  // Используем атомарную операцию с onConflict для предотвращения race condition
  const [tempConversation] = await db
    .insert(telegramConversation)
    .values({
      chatId,
      candidateName: firstName || undefined,
      username,
      status: "ACTIVE",
      metadata: JSON.stringify({
        identifiedBy: "none",
        awaitingPin: true,
      }),
    })
    .onConflictDoUpdate({
      target: telegramConversation.chatId,
      set: {
        username: username || undefined,
        candidateName: firstName || undefined,
      },
    })
    .returning();

  // Сохраняем сообщение пользователя в БД
  if (tempConversation) {
    await db.insert(telegramMessage).values({
      conversationId: tempConversation.id,
      sender: "CANDIDATE",
      contentType: "TEXT",
      content: text,
      telegramMessageId: message.id.toString(),
    });
  }

  // Сначала пытаемся найти пин-код в сообщении
  const pinCode = extractPinCode(text);

  if (pinCode) {
    // Используем сервис идентификации
    const identification = await identifyByPinCode(
      pinCode,
      chatId,
      username,
      firstName,
    );

    if (identification.success && identification.conversationId) {
      // Сохраняем сообщение кандидата с пин-кодом
      await saveMessage(
        identification.conversationId,
        "CANDIDATE",
        text,
        "TEXT",
        message.id.toString(),
      );

      // Получаем данные для начала интервью
      const interviewData = identification.responseId
        ? await getInterviewStartData(identification.responseId)
        : null;

      // Генерируем приветственное сообщение и начинаем интервью
      const resumeData = interviewData
        ? {
            experience: interviewData.experience || undefined,
            coverLetter: interviewData.coverLetter || undefined,
            phone: interviewData.phone || undefined,
          }
        : undefined;

      const aiResponse = await generateAIResponse({
        messageText: text,
        stage: "PIN_RECEIVED",
        candidateName: identification.candidateName || firstName,
        vacancyTitle: identification.vacancyTitle,
        responseStatus: interviewData?.status,
        resumeData,
      });

      // Сохраняем ответ бота
      const botMessageId = await saveMessage(
        identification.conversationId,
        "BOT",
        aiResponse,
        "TEXT",
      );

      if (botMessageId && username) {
        await triggerMessageSend(
          botMessageId,
          username,
          aiResponse,
          workspaceId,
        );
      }

      return;
    }

    // Если пин-код неверный, сообщаем об этом пользователю
    if (!identification.success) {
      const aiResponse = await generateAIResponse({
        messageText: text,
        stage: "INVALID_PIN",
        candidateName: firstName,
        errorMessage: identification.error,
      });

      if (tempConversation) {
        const [botMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: tempConversation.id,
            sender: "BOT",
            contentType: "TEXT",
            content: aiResponse,
          })
          .returning();

        if (botMessage && username) {
          await triggerMessageSend(
            botMessage.id,
            username,
            aiResponse,
            workspaceId,
          );
        }
      }

      return;
    }
  }

  // Получаем историю диалога из чата для контекста
  const conversationHistory = await getChatHistory(client, message.chat.id, 10);

  // Пытаемся найти вакансии по тексту сообщения
  const escapedText = escapeSqlLike(text);
  const vacancies = await db.query.vacancy.findMany({
    where: ilike(vacancy.title, `%${escapedText}%`),
    limit: 5,
  });

  if (vacancies.length === 0) {
    // Вакансии не найдены - запрашиваем PIN
    const aiResponse = await generateAIResponse({
      messageText: text,
      stage: "AWAITING_PIN",
      candidateName: firstName,
      conversationHistory,
    });

    // Обновляем существующую беседу
    if (tempConversation) {
      const [updatedConversation] = await db
        .update(telegramConversation)
        .set({
          username,
          metadata: JSON.stringify({
            identifiedBy: "none",
            awaitingPin: true,
          }),
        })
        .where(eq(telegramConversation.id, tempConversation.id))
        .returning();

      const conversationToUse = updatedConversation || tempConversation;

      const [botMessage] = await db
        .insert(telegramMessage)
        .values({
          conversationId: conversationToUse.id,
          sender: "BOT",
          contentType: "TEXT",
          content: aiResponse,
        })
        .returning();

      if (botMessage && username) {
        await triggerMessageSend(
          botMessage.id,
          username,
          aiResponse,
          workspaceId,
        );
      }
    }

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

    if (response && username) {
      // Используем сервис идентификации
      const identification = await identifyByVacancy(
        foundVacancy.id,
        chatId,
        username,
        firstName,
      );

      if (identification.success && identification.conversationId) {
        // Сохраняем сообщение кандидата
        await saveMessage(
          identification.conversationId,
          "CANDIDATE",
          text,
          "TEXT",
          message.id.toString(),
        );

        // Получаем данные для начала интервью
        const interviewData = identification.responseId
          ? await getInterviewStartData(identification.responseId)
          : null;

        // Генерируем приветственное сообщение и начинаем интервью
        const resumeData = interviewData
          ? {
              experience: interviewData.experience || undefined,
              coverLetter: interviewData.coverLetter || undefined,
              phone: interviewData.phone || undefined,
            }
          : undefined;

        const aiResponse = await generateAIResponse({
          messageText: text,
          stage: "PIN_RECEIVED",
          candidateName: identification.candidateName || firstName,
          vacancyTitle: identification.vacancyTitle,
          responseStatus: interviewData?.status,
          resumeData,
        });

        // Сохраняем ответ бота
        const botMessageId = await saveMessage(
          identification.conversationId,
          "BOT",
          aiResponse,
          "TEXT",
        );

        if (botMessageId && username) {
          await triggerMessageSend(
            botMessageId,
            username,
            aiResponse,
            workspaceId,
          );
        }
      }

      return;
    }
  }

  // Если нашли несколько вакансий - запрашиваем PIN
  const vacancyList = vacancies.map((v) => v?.title).join(", ");

  const aiResponse = await generateAIResponse({
    messageText: `${text}\n\nНайденные вакансии: ${vacancyList}`,
    stage: "AWAITING_PIN",
    candidateName: firstName,
    conversationHistory,
  });

  // Обновляем существующую беседу
  if (tempConversation) {
    const [updatedConversation] = await db
      .update(telegramConversation)
      .set({
        username,
        metadata: JSON.stringify({
          identifiedBy: "none",
          awaitingPin: true,
          foundVacancies: vacancyList,
        }),
      })
      .where(eq(telegramConversation.id, tempConversation.id))
      .returning();

    const conversationToUse = updatedConversation || tempConversation;

    const [botMessage] = await db
      .insert(telegramMessage)
      .values({
        conversationId: conversationToUse.id,
        sender: "BOT",
        contentType: "TEXT",
        content: aiResponse,
      })
      .returning();

    if (botMessage && username) {
      await triggerMessageSend(
        botMessage.id,
        username,
        aiResponse,
        workspaceId,
      );
    }
  }
}
