import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  conversation,
  conversationMessage,
  telegramSession,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { logResponseEvent } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInvite,
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "../../../services/messaging";
import { inngest } from "../../client";

/**
 * Inngest функция для отправки приветственного сообщения кандидату в Telegram по username
 */
export const sendCandidateWelcomeFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome",
    name: "Send Candidate Welcome Message",
    retries: 3,
  },
  { event: "candidate/welcome" },
  async ({ event, step }) => {
    const { responseId, username, phone } = event.data;

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

    const welcomeMessage = await step.run(
      "generate-welcome-message",
      async () => {
        console.log("🤖 Генерация приветственного сообщения", {
          responseId,
          username,
        });

        try {
          const result = await generateWelcomeMessage(responseId);

          if (!result.success) {
            throw new Error(result.error);
          }

          const message = result.data;

          console.log("✅ Сообщение сгенерировано", {
            responseId,
            messageLength: message.length,
          });

          return message;
        } catch (error) {
          console.error("❌ Ошибка генерации приветствия", {
            responseId,
            error,
          });
          throw error;
        }
      },
    );

    const result = await step.run("send-telegram-message", async () => {
      console.log("📤 Отправка сообщения пользователю", {
        responseId,
        username,
        phone,
      });

      try {
        // Получаем активную сессию для workspace
        const workspaceId = response.vacancy.workspaceId;
        const session = await db.query.telegramSession.findFirst({
          where: eq(telegramSession.workspaceId, workspaceId),
          orderBy: (sessions, { desc }) => [desc(sessions.lastUsedAt)],
        });

        if (!session) {
          throw new Error(
            `Нет активной Telegram сессии для workspace ${workspaceId}`,
          );
        }

        let sendResult: {
          success: boolean;
          messageId: string;
          chatId: string;
          senderId?: string;
          channel: "TELEGRAM" | "HH";
          sentMessage: string;
        } | null = null;

        // Пытаемся отправить по username, если он есть
        if (username) {
          console.log(`📨 Попытка отправки по username: @${username}`);
          try {
            const tgResult = await tgClientSDK.sendMessageByUsername({
              workspaceId,
              username,
              text: welcomeMessage,
            });

            if (tgResult) {
              console.log("✅ Сообщение отправлено по username", {
                responseId,
                username,
                chatId: tgResult.chatId,
              });

              // Обновляем lastUsedAt
              await db
                .update(telegramSession)
                .set({ lastUsedAt: new Date() })
                .where(eq(telegramSession.id, session.id));

              sendResult = {
                ...tgResult,
                channel: "TELEGRAM",
                sentMessage: welcomeMessage,
              };
              return sendResult;
            }
          } catch (error) {
            console.log(
              `⚠️ Не удалось отправить по username: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        // Если username не сработал или его нет, пробуем по телефону
        if (phone) {
          console.log(`📞 Попытка отправки по номеру телефона: ${phone}`);
          try {
            const tgResult = await tgClientSDK.sendMessageByPhone({
              workspaceId,
              phone,
              text: welcomeMessage,
              firstName: response.candidateName || undefined,
            });

            if (tgResult) {
              console.log("✅ Сообщение отправлено по номеру телефона", {
                responseId,
                phone,
                chatId: tgResult.chatId,
              });

              // Обновляем lastUsedAt
              await db
                .update(telegramSession)
                .set({ lastUsedAt: new Date() })
                .where(eq(telegramSession.id, session.id));

              sendResult = {
                ...tgResult,
                channel: "TELEGRAM",
                sentMessage: welcomeMessage,
              };
              return sendResult;
            }
          } catch (error) {
            console.log(
              `⚠️ Не удалось отправить по телефону: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
          }
        }

        // Если Telegram не сработал, пробуем hh.ru
        if (!sendResult) {
          console.log(`📧 Попытка отправки через hh.ru`);

          // Generate PIN code first
          const pinCodeResult = await generateTelegramInvite({
            responseId,
            botUsername: "", // Not needed anymore
          });

          const inviteMessageResult =
            await generateTelegramInviteMessage(responseId);

          let messageWithInvite = inviteMessageResult.success
            ? inviteMessageResult.data
            : welcomeMessage;

          // Get telegram username from session userInfo
          const userInfo = session.userInfo as { username?: string } | null;
          const telegramUsername =
            userInfo?.username || env.TELEGRAM_BOT_USERNAME;

          if (telegramUsername && pinCodeResult.success) {
            messageWithInvite = `${messageWithInvite}\n\n📱 Напишите мне в Telegram @${telegramUsername}`;
          }

          const hhResult = await sendHHChatMessage({
            workspaceId: response.vacancy.workspaceId,
            responseId,
            text: messageWithInvite,
          });

          if (hhResult.success) {
            console.log(`✅ Сообщение отправлено через hh.ru`);

            // Обновляем статус отправки приветствия
            await db
              .update(vacancyResponse)
              .set({
                welcomeSentAt: new Date(),
              })
              .where(eq(vacancyResponse.id, responseId));

            sendResult = {
              success: true,
              messageId: "",
              chatId: response.chatId || "",
              channel: "HH",
              sentMessage: messageWithInvite,
            };
            return sendResult;
          }

          console.error(
            `❌ Не удалось отправить через hh.ru: ${hhResult.error}`,
          );
        }

        // Если ничего не сработало
        throw new Error(
          username && phone
            ? `Не удалось отправить сообщение ни по username (@${username}), ни по телефону (${phone})`
            : username
              ? `Не удалось отправить сообщение по username (@${username}), телефон не указан`
              : phone
                ? `Username не указан, не удалось отправить по телефону (${phone})`
                : "Не указаны ни username, ни телефон",
        );
      } catch (error) {
        console.error("❌ Ошибка отправки сообщения в Telegram", {
          responseId,
          username,
          phone,
          error,
        });
        throw error;
      }
    });

    // Если получили chatId, сохраняем/обновляем conversation
    if (result?.chatId) {
      const chatId = result.chatId;
      await step.run("save-conversation", async () => {
        // Проверяем, есть ли уже conversation для этого response
        const existing = await db.query.conversation.findFirst({
          where: eq(conversation.responseId, responseId),
        });

        const metadata = JSON.stringify({
          responseId,
          vacancyId: response.vacancyId,
          username,
          senderId: result && "senderId" in result ? result.senderId : chatId,
          interviewStarted: true,
          questionAnswers: [],
        });

        if (existing) {
          // Обновляем существующую conversation
          await db
            .update(conversation)
            .set({
              candidateName: response.candidateName,
              username: username || undefined,
              status: "ACTIVE",
              metadata,
            })
            .where(eq(conversation.id, existing.id));
        } else {
          // Создаем новую conversation
          await db.insert(conversation).values({
            responseId,
            candidateName: response.candidateName,
            username: username || undefined,
            status: "ACTIVE",
            metadata,
          });
        }

           const conv = await db.query.conversation.findFirst({
          where: eq(conversation.responseId, responseId),
        });

        if (!conv) {
          throw new Error("Failed to create/update conversation");
        }

        // Сохраняем приветственное сообщение с правильным каналом и текстом
        await db.insert(conversationMessage).values({
          conversationId: conv.id,
          sender: "BOT",
          contentType: "TEXT",
          channel: result.channel,
          content: result.sentMessage,
          externalMessageId: result.messageId,
        });

        return conv;
      });

      // Обновляем welcomeSentAt только после успешной отправки
      await step.run("update-welcome-sent", async () => {
        await db
          .update(vacancyResponse)
          .set({ welcomeSentAt: new Date() })
          .where(eq(vacancyResponse.id, responseId));
        
        await logResponseEvent({
          db,
          responseId,
          eventType: "WELCOME_SENT",
          metadata: { chatId: result.chatId },
        });
      });

      return {
        success: true,
        chatId: result.chatId,
        messageId: result.messageId,
      };
    }

    return { success: false, error: "No chatId received" };
  },
);
