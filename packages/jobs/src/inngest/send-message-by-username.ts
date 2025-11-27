import { db } from "@selectio/db";
import { eq } from "@selectio/db";
import { telegramConversation, vacancyResponse } from "@selectio/db/schema";
import { sendMessageByUsername } from "@selectio/telegram-bot";
import { inngest } from "./client";

/**
 * Inngest функция для отправки сообщения кандидату по username в Telegram
 */
export const sendMessageByUsernameFunction = inngest.createFunction(
  {
    id: "send-message-by-username",
    name: "Send Message by Username",
    retries: 3,
  },
  { event: "telegram/send-by-username" },
  async ({ event, step }) => {
    const { responseId, username, message } = event.data;

    // Получаем данные отклика
    const response = await step.run("fetch-response-data", async () => {
      const result = await db.query.vacancyResponse.findFirst({
        where: eq(vacancyResponse.id, responseId),
        with: {
          vacancy: true,
        },
      });

      if (!result) {
        throw new Error(`Отклик не найден: ${responseId}`);
      }

      return result;
    });

    // Формируем приветственное сообщение
    const welcomeMessage =
      message ||
      `Здравствуйте, ${response.candidateName || ""}!

Спасибо за отклик на вакансию "${response.vacancy?.title || ""}".

Мы рассмотрели ваше резюме и хотели бы пообщаться с вами подробнее.`;

    // Отправляем сообщение через MTCute
    const result = await step.run("send-telegram-message", async () => {
      console.log(`📤 Отправка сообщения пользователю @${username}`);
      return await sendMessageByUsername(username, welcomeMessage);
    });

    if (!result.success) {
      throw new Error(result.message);
    }

    // Если получили chatId, сохраняем в базу
    if (result.chatId) {
      const chatId = result.chatId;
      await step.run("save-conversation", async () => {
        await db
          .insert(telegramConversation)
          .values({
            chatId,
            candidateName: response.candidateName,
            status: "ACTIVE",
            metadata: JSON.stringify({
              responseId,
              vacancyId: response.vacancyId,
              username,
            }),
          })
          .onConflictDoUpdate({
            target: telegramConversation.chatId,
            set: {
              candidateName: response.candidateName,
              status: "ACTIVE",
              metadata: JSON.stringify({
                responseId,
                vacancyId: response.vacancyId,
                username,
              }),
            },
          });

        console.log(`✅ Сохранена беседа с chatId: ${chatId}`);
      });
    }

    return {
      success: true,
      message: "Сообщение отправлено",
      chatId: result.chatId,
    };
  }
);
