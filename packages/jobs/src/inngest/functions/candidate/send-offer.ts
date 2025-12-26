import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  conversation,
  conversationMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent, removeNullBytes } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

export const sendOfferFunction = inngest.createFunction(
  {
    id: "candidate-send-offer",
    name: "Отправка оффера кандидату",
    retries: 3,
  },
  { event: "candidate/offer.send" },
  async ({ event, step }) => {
    const { responseId, workspaceId, offerDetails } = event.data;

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

    // Проверяем, есть ли conversation для этого кандидата
    const conv = await step.run("fetch-conversation", async () => {
      return await db.query.conversation.findFirst({
        where: eq(conversation.responseId, responseId),
      });
    });

    if (!conv) {
      console.log("У кандидата нет активной беседы, пропускаем отправку");
      return { success: false, reason: "no_conversation" };
    }

    const offerMessage = await step.run("generate-offer-message", async () => {
      return `🎉 Поздравляем! Мы готовы сделать вам предложение о работе!

📋 Детали предложения:
• Должность: ${offerDetails.position}
• Зарплата: ${offerDetails.salary}
• Дата начала: ${offerDetails.startDate}
${offerDetails.benefits ? `• Бенефиты: ${offerDetails.benefits}` : ""}

${offerDetails.message ? `\n${offerDetails.message}\n` : ""}
Пожалуйста, подтвердите получение этого предложения и сообщите нам о вашем решении.`;
    });

    const result = await step.run("send-telegram-message", async () => {
      try {
        // Отправляем сообщение через SDK
        const tgResult = await tgClientSDK.sendMessage({
          workspaceId,
          chatId: Number(conv.username || response.chatId),
          text: offerMessage,
        });

        if (tgResult) {
          console.log("✅ Оффер отправлен", {
            responseId,
            chatId: tgResult.chatId,
          });

          return {
            success: true,
            messageId: tgResult.messageId,
            chatId: tgResult.chatId,
          };
        }

        throw new Error("Не удалось отправить сообщение");
      } catch (error) {
        console.error("❌ Ошибка отправки оффера", {
          responseId,
          error,
        });
        throw error;
      }
    });

    // Сохраняем сообщение в базу
    await step.run("save-message", async () => {
      await db.insert(conversationMessage).values({
        conversationId: conv.id,
        sender: "BOT",
        contentType: "TEXT",
        channel: "TELEGRAM",
        content: removeNullBytes(offerMessage),
        externalMessageId: result.messageId,
      });
    });

    // Логируем событие
    await step.run("log-event", async () => {
      await logResponseEvent({
        db,
        responseId,
        eventType: "OFFER_SENT",
        metadata: { offerDetails },
      });
    });

    return { success: true, responseId, messageId: result.messageId };
  },
);
