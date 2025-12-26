import { env } from "@qbs-autonaim/config";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  conversation,
  conversationMessage,
  telegramSession,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { removeNullBytes } from "@qbs-autonaim/lib";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import {
  generateTelegramInvite,
  generateTelegramInviteMessage,
  generateWelcomeMessage,
  sendHHChatMessage,
} from "../../../services/messaging";
import { inngest } from "../../client";

/**
 * Inngest функция для массовой отправки приветственных сообщений кандидатам
 * Использует batch events для эффективной обработки множества откликов
 */
export const sendCandidateWelcomeBatchFunction = inngest.createFunction(
  {
    id: "send-candidate-welcome-batch",
    name: "Send Candidate Welcome Messages (Batch)",
    batchEvents: {
      maxSize: 4,
      timeout: "10s",
    },
  },
  { event: "candidate/welcome.batch" },
  async ({ events, step }) => {
    console.log(
      `🚀 Запуск массовой отправки приветствий для ${events.length} событий`,
    );

    // Собираем все responseIds из всех событий
    const allResponseIds = events.flatMap((evt) => evt.data.responseIds);

    console.log(`📋 Всего откликов для обработки: ${allResponseIds.length}`);

    // Получаем данные откликов с username или телефоном
    const responses = await step.run("fetch-responses", async () => {
      const results = await db.query.vacancyResponse.findMany({
        where: (fields, { inArray }) => inArray(fields.id, allResponseIds),
        columns: {
          id: true,
          telegramUsername: true,
          phone: true,
          candidateName: true,
          vacancyId: true,
          chatId: true,
        },
        with: {
          vacancy: {
            columns: {
              workspaceId: true,
            },
          },
        },
      });

      console.log(`✅ Найдено откликов в БД: ${results.length}`);
      return results;
    });

    // Фильтруем отклики с username или телефоном
    const responsesWithContact = responses.filter(
      (r) => r.telegramUsername || r.phone,
    );
    const skippedCount = responses.length - responsesWithContact.length;

    console.log(
      `📤 Отклики с контактами: ${responsesWithContact.length}, пропущено: ${skippedCount}`,
    );

    // Обрабатываем каждый отклик
    const results = await Promise.allSettled(
      responsesWithContact.map(async (response) => {
        return await step.run(`send-welcome-${response.id}`, async () => {
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

            // Генерируем приветственное сообщение
            const welcomeResult = await generateWelcomeMessage(response.id);
            if (!welcomeResult.success) {
              throw new Error(welcomeResult.error);
            }
            const welcomeMessage = welcomeResult.data;

            let sendResult: {
              success: boolean;
              messageId: string;
              chatId: string;
            } | null = null;

            let actualSentMessage = welcomeMessage;

            // Пытаемся отправить по username, если он есть
            if (response.telegramUsername) {
              console.log(
                `📨 Попытка отправки по username: @${response.telegramUsername}`,
              );
              try {
                sendResult = await tgClientSDK.sendMessageByUsername({
                  workspaceId,
                  username: response.telegramUsername,
                  text: welcomeMessage,
                });
              } catch (_error) {
                if (response.phone) {
                  console.log(
                    `⚠️ Не удалось отправить по username, пробуем по телефону`,
                  );
                }
              }
            }

            // Если username не сработал или его нет, пробуем по телефону
            if (!sendResult && response.phone) {
              console.log(
                `📞 Попытка отправки по номеру телефона: ${response.phone}`,
              );
              sendResult = await tgClientSDK.sendMessageByPhone({
                workspaceId,
                phone: response.phone,
                text: welcomeMessage,
                firstName: response.candidateName || undefined,
              });
            }

            // Если не удалось отправить через Telegram, пробуем через hh.ru
            if (!sendResult) {
              console.log(`📧 Попытка отправки через hh.ru`);

              // Generate PIN code first
              const pinCodeResult = await generateTelegramInvite({
                responseId: response.id,
                botUsername: "", // Not needed anymore
              });

              const inviteMessageResult = await generateTelegramInviteMessage(
                response.id,
              );

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

              actualSentMessage = messageWithInvite;

              const hhResult = await sendHHChatMessage({
                workspaceId,
                responseId: response.id,
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
                  .where(eq(vacancyResponse.id, response.id));

                return {
                  responseId: response.id,
                  username: response.telegramUsername,
                  chatId: response.chatId || "",
                  success: true,
                  method: "hh",
                  sentMessage: actualSentMessage,
                };
              }

              console.error(
                `❌ Не удалось отправить через hh.ru: ${hhResult.error}`,
              );
            }

            if (!sendResult) {
              throw new Error("Не удалось отправить сообщение");
            }

            // Обновляем lastUsedAt для сессии
            await db
              .update(telegramSession)
              .set({ lastUsedAt: new Date() })
              .where(eq(telegramSession.id, session.id));

            // Сохраняем беседу если получили chatId
            if (sendResult.chatId) {
              // Проверяем, есть ли уже conversation для этого response
              const existing = await db.query.conversation.findFirst({
                where: eq(conversation.responseId, response.id),
              });

              let conv: typeof conversation.$inferSelect | undefined;
              if (existing) {
                // Парсим существующие метаданные
                let existingMetadata: Record<string, unknown> = {};
                if (existing.metadata) {
                  try {
                    existingMetadata = JSON.parse(existing.metadata);
                  } catch (error) {
                    console.error("Failed to parse existing metadata", {
                      conversationId: existing.id,
                      error,
                    });
                  }
                }

                // Объединяем с новыми данными
                const updatedMetadata = {
                  ...existingMetadata,
                  responseId: response.id,
                  vacancyId: response.vacancyId,
                  username: response.telegramUsername,
                  interviewStarted: true,
                  questionAnswers: existingMetadata.questionAnswers || [],
                };

                // Обновляем существующую conversation
                const [updated] = await db
                  .update(conversation)
                  .set({
                    candidateName: response.candidateName,
                    username: response.telegramUsername || undefined,
                    status: "ACTIVE",
                    metadata: JSON.stringify(updatedMetadata),
                  })
                  .where(eq(conversation.id, existing.id))
                  .returning();
                conv = updated;
              } else {
                // Создаем новую conversation
                const newMetadata = {
                  responseId: response.id,
                  vacancyId: response.vacancyId,
                  username: response.telegramUsername,
                  interviewStarted: true,
                  questionAnswers: [],
                };

                const [created] = await db
                  .insert(conversation)
                  .values({
                    responseId: response.id,
                    candidateName: response.candidateName,
                    username: response.telegramUsername || undefined,
                    status: "ACTIVE",
                    metadata: JSON.stringify(newMetadata),
                  })
                  .returning();
                conv = created;
              }

              // Сохраняем приветственное сообщение в историю
              if (conv) {
                await db.insert(conversationMessage).values({
                  conversationId: conv.id,
                  sender: "BOT",
                  contentType: "TEXT",
                  content: removeNullBytes(actualSentMessage),
                  externalMessageId: sendResult.messageId,
                });
              }
            }

            // Обновляем статус отправки приветствия
            await db
              .update(vacancyResponse)
              .set({
                welcomeSentAt: new Date(),
              })
              .where(eq(vacancyResponse.id, response.id));

            console.log(
              `✅ Приветствие отправлено: ${response.id} (@${response.telegramUsername})`,
            );

            return {
              responseId: response.id,
              username: response.telegramUsername,
              chatId: sendResult.chatId,
              success: true,
              method: "telegram",
              sentMessage: actualSentMessage,
            };
          } catch (error) {
            console.error(
              `❌ Ошибка отправки приветствия для ${response.id}:`,
              error,
            );
            return {
              responseId: response.id,
              username: response.telegramUsername,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            };
          }
        });
      }),
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(
      `✅ Завершено: успешно ${successful}, ошибок ${failed}, пропущено ${skippedCount}`,
    );

    return {
      success: true,
      total: allResponseIds.length,
      sent: successful,
      failed,
      skipped: skippedCount,
    };
  },
);
