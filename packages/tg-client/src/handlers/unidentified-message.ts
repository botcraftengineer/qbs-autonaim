import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { db, eq } from "@qbs-autonaim/db";
import { telegramConversation, telegramMessage } from "@qbs-autonaim/db/schema";
import {
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
import { generateAIResponse } from "../utils/ai-response";
import { triggerMessageSend } from "../utils/inngest";
import { getChatHistory, markRead } from "../utils/telegram";

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

      let aiResponse: string;
      try {
        aiResponse = await generateAIResponse({
          messageText: text,
          stage: "PIN_RECEIVED",
          candidateName: identification.candidateName || firstName,
          vacancyTitle: identification.vacancyTitle,
          responseStatus: interviewData?.status,
          resumeData,
        });
      } catch (error) {
        console.error("Ошибка генерации AI ответа для PIN_RECEIVED:", {
          error,
          chatId,
          candidateName: identification.candidateName || firstName,
          vacancyTitle: identification.vacancyTitle,
        });
        aiResponse = `Здравствуйте${identification.candidateName ? `, ${identification.candidateName}` : ""}! Спасибо за предоставленный PIN-код. Я ваш рекрутер, и я готов обсудить с вами вакансию${identification.vacancyTitle ? ` "${identification.vacancyTitle}"` : ""}. Расскажите, пожалуйста, немного о себе и своем опыте.`;
      }

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
      let aiResponse: string;
      try {
        aiResponse = await generateAIResponse({
          messageText: text,
          stage: "INVALID_PIN",
          candidateName: firstName,
          errorMessage: identification.error,
        });
      } catch (error) {
        console.error("Ошибка генерации AI ответа для INVALID_PIN:", {
          error,
          chatId,
          candidateName: firstName,
          pinCode,
        });
        aiResponse = `К сожалению, указанный PIN-код не найден. Пожалуйста, проверьте правильность кода и попробуйте снова. PIN-код должен состоять из 4 цифр.`;
      }

      if (tempConversation) {
        // Проверяем, не сохранено ли уже это сообщение
        const existingMessage = await db.query.telegramMessage.findFirst({
          where: (messages, { and, eq }) =>
            and(
              eq(messages.conversationId, tempConversation.id),
              eq(messages.telegramMessageId, message.id.toString()),
            ),
        });

        // Сохраняем сообщение кандидата с неверным пин-кодом только если его еще нет
        if (!existingMessage) {
          await db.insert(telegramMessage).values({
            conversationId: tempConversation.id,
            sender: "CANDIDATE",
            contentType: "TEXT",
            content: text,
            telegramMessageId: message.id.toString(),
          });
        }

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
  } else {
    const conversationHistory = await getChatHistory(
      client,
      message.chat.id,
      10,
    );

    let aiResponse: string;
    try {
      aiResponse = await generateAIResponse({
        messageText: text,
        stage: "AWAITING_PIN",
        candidateName: firstName,
        conversationHistory,
      });
    } catch (error) {
      console.error("Ошибка генерации AI ответа для AWAITING_PIN:", {
        error,
        chatId,
        candidateName: firstName,
      });
      aiResponse = `Здравствуйте${firstName ? `, ${firstName}` : ""}! Для начала работы, пожалуйста, предоставьте ваш 4-значный PIN-код, который вы получили в письме с откликом на вакансию.`;
    }

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

      // Проверяем, не сохранено ли уже это сообщение
      const existingMessage = await db.query.telegramMessage.findFirst({
        where: (messages, { and, eq }) =>
          and(
            eq(messages.conversationId, conversationToUse.id),
            eq(messages.telegramMessageId, message.id.toString()),
          ),
      });

      // Сохраняем сообщение кандидата только если его еще нет
      if (!existingMessage) {
        await db.insert(telegramMessage).values({
          conversationId: conversationToUse.id,
          sender: "CANDIDATE",
          contentType: "TEXT",
          content: text,
          telegramMessageId: message.id.toString(),
        });
      }

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
}
