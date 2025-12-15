import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  companySettings,
  telegramConversation,
  telegramMessage,
} from "@qbs-autonaim/db/schema";
import {
  generateText,
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
import { buildTelegramRecruiterPrompt } from "@qbs-autonaim/prompts";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../client";

interface MessagePayload {
  workspaceId: string;
  messageData: {
    id: number;
    chatId: string;
    text?: string;
    isOutgoing: boolean;
    media?: {
      type: string;
      fileId?: string;
      mimeType?: string;
      duration?: number;
      [key: string]: unknown;
    };
    sender?: {
      type: string;
      username?: string;
      firstName?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

function extractPinCode(text: string): string | null {
  const match = text.match(/\b\d{4}\b/);
  return match ? match[0] : null;
}

async function findDuplicateMessage(
  conversationId: string,
  telegramMessageId: string,
): Promise<boolean> {
  const existingMessage = await db.query.telegramMessage.findFirst({
    where: (messages, { and, eq }) =>
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.telegramMessageId, telegramMessageId),
      ),
  });
  return !!existingMessage;
}

async function getCompanyBotSettings(workspaceId: string) {
  const company = await db.query.companySettings.findFirst({
    where: eq(companySettings.workspaceId, workspaceId),
  });
  return {
    botName: company?.botName ?? "Дмитрий",
    botRole: company?.botRole ?? "рекрутер",
  };
}

export const processIncomingMessageFunction = inngest.createFunction(
  {
    id: "telegram-process-incoming-message",
    name: "Process Incoming Telegram Message",
    retries: 3,
  },
  { event: "telegram/message.received" },
  async ({ event, step }) => {
    const { workspaceId, messageData } = event.data as MessagePayload;

    if (messageData.isOutgoing) {
      return { skipped: true, reason: "outgoing message" };
    }

    const chatId = messageData.chatId;
    const username = messageData.sender?.username;
    const firstName = messageData.sender?.firstName;

    // Загружаем настройки бота
    const botSettings = await step.run("load-bot-settings", async () => {
      return await getCompanyBotSettings(workspaceId);
    });

    // Проверяем идентификацию
    const conversation = await step.run("check-conversation", async () => {
      const [conv] = await db
        .select()
        .from(telegramConversation)
        .where(eq(telegramConversation.chatId, chatId))
        .limit(1);
      return conv;
    });

    const isIdentified = conversation?.responseId != null;

    // Обработка неидентифицированных сообщений
    if (!isIdentified) {
      if (messageData.text) {
        await step.run("handle-unidentified-text", async () => {
          const text = (messageData.text || "").trim();
          const pinCode = extractPinCode(text);

          // Создаем или обновляем временную беседу
          const updateSet: Record<string, string | undefined> = {};
          if (username !== undefined) {
            updateSet.username = username;
          }
          if (firstName !== undefined) {
            updateSet.candidateName = firstName;
          }

          const [tempConv] = await db
            .insert(telegramConversation)
            .values({
              chatId,
              candidateName: firstName,
              username,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "none",
                awaitingPin: true,
              }),
            })
            .onConflictDoUpdate({
              target: telegramConversation.chatId,
              set: updateSet,
            })
            .returning();

          if (pinCode) {
            // Пытаемся идентифицировать по пин-коду
            const identification = await identifyByPinCode(
              pinCode,
              chatId,
              workspaceId,
              username,
              firstName,
            );

            if (
              identification.success &&
              identification.conversationId &&
              identification.responseId
            ) {
              await saveMessage(
                identification.conversationId,
                "CANDIDATE",
                text,
                "TEXT",
                messageData.id.toString(),
              );

              // Получаем данные для интервью
              const interviewData = await getInterviewStartData(
                identification.responseId,
              );

              // Получаем историю сообщений для контекста
              const conversationHistory =
                await db.query.telegramMessage.findMany({
                  where: eq(
                    telegramMessage.conversationId,
                    identification.conversationId,
                  ),
                  orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                  limit: 10,
                });

              // Генерируем ответ через AI
              const prompt = buildTelegramRecruiterPrompt({
                messageText: text,
                stage: "PIN_RECEIVED",
                candidateName: interviewData?.candidateName ?? undefined,
                vacancyTitle: interviewData?.vacancyTitle ?? undefined,
                vacancyRequirements:
                  interviewData?.vacancyRequirements ?? undefined,
                conversationHistory: conversationHistory.map((msg) => ({
                  sender: msg.sender,
                  content: msg.content,
                  contentType: msg.contentType,
                })),
                resumeData: {
                  experience: interviewData?.experience ?? undefined,
                  coverLetter: interviewData?.coverLetter ?? undefined,
                },
                customBotInstructions:
                  interviewData?.customBotInstructions ?? undefined,
                customInterviewQuestions:
                  interviewData?.customInterviewQuestions ?? undefined,
                customOrganizationalQuestions:
                  interviewData?.customOrganizationalQuestions ?? undefined,
                botName: interviewData?.botName ?? "Дмитрий",
                botRole: interviewData?.botRole ?? "рекрутер",
              });

              const { text: aiResponse } = await generateText({
                prompt,
                generationName: "telegram-pin-received",
                entityId: identification.conversationId,
                metadata: {
                  candidateName: interviewData?.candidateName ?? undefined,
                  vacancyTitle: interviewData?.vacancyTitle ?? undefined,
                },
              });

              const botMessageId = await saveMessage(
                identification.conversationId,
                "BOT",
                aiResponse,
                "TEXT",
              );

              if (botMessageId && username) {
                await inngest.send({
                  name: "telegram/message.send.by-username",
                  data: {
                    messageId: botMessageId,
                    username,
                    content: aiResponse,
                    workspaceId,
                  },
                });
              }

              // Запускаем анализ интервью для первого сообщения после идентификации
              await inngest.send({
                name: "telegram/interview.analyze",
                data: {
                  conversationId: identification.conversationId,
                  transcription: text,
                },
              });

              return { identified: true };
            }

            // Неверный пин-код - генерируем ответ через AI
            if (tempConv) {
              const existingMsg = await db.query.telegramMessage.findFirst({
                where: (messages, { and, eq }) =>
                  and(
                    eq(messages.conversationId, tempConv.id),
                    eq(messages.telegramMessageId, messageData.id.toString()),
                  ),
              });

              if (!existingMsg) {
                await db.insert(telegramMessage).values({
                  conversationId: tempConv.id,
                  sender: "CANDIDATE",
                  contentType: "TEXT",
                  content: text,
                  telegramMessageId: messageData.id.toString(),
                });
              }

              // Получаем историю для контекста
              const conversationHistory =
                await db.query.telegramMessage.findMany({
                  where: eq(telegramMessage.conversationId, tempConv.id),
                  orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                  limit: 10,
                });

              // Генерируем ответ через AI для неверного PIN
              const prompt = buildTelegramRecruiterPrompt({
                messageText: text,
                stage: "INVALID_PIN",
                candidateName: firstName,
                conversationHistory: conversationHistory.map((msg) => ({
                  sender: msg.sender,
                  content: msg.content,
                  contentType: msg.contentType,
                })),
                botName: botSettings.botName,
                botRole: botSettings.botRole,
              });

              const { text: errorResponse } = await generateText({
                prompt,
                generationName: "telegram-invalid-pin",
                entityId: tempConv.id,
                metadata: {
                  candidateName: firstName,
                },
              });

              const [botMsg] = await db
                .insert(telegramMessage)
                .values({
                  conversationId: tempConv.id,
                  sender: "BOT",
                  contentType: "TEXT",
                  content: errorResponse,
                })
                .returning();

              if (botMsg && username) {
                await inngest.send({
                  name: "telegram/message.send.by-username",
                  data: {
                    messageId: botMsg.id,
                    username,
                    content: errorResponse,
                    workspaceId,
                  },
                });
              }
            }

            return { identified: false, invalidPin: true };
          }

          // Нет пин-кода - генерируем запрос через AI
          if (tempConv) {
            const existingMsg = await db.query.telegramMessage.findFirst({
              where: (messages, { and, eq }) =>
                and(
                  eq(messages.conversationId, tempConv.id),
                  eq(messages.telegramMessageId, messageData.id.toString()),
                ),
            });

            if (!existingMsg) {
              await db.insert(telegramMessage).values({
                conversationId: tempConv.id,
                sender: "CANDIDATE",
                contentType: "TEXT",
                content: text,
                telegramMessageId: messageData.id.toString(),
              });
            }

            // Получаем историю для контекста
            const conversationHistory = await db.query.telegramMessage.findMany(
              {
                where: eq(telegramMessage.conversationId, tempConv.id),
                orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                limit: 10,
              },
            );

            // Генерируем ответ через AI для запроса PIN
            const prompt = buildTelegramRecruiterPrompt({
              messageText: text,
              stage: "AWAITING_PIN",
              candidateName: firstName,
              conversationHistory: conversationHistory.map((msg) => ({
                sender: msg.sender,
                content: msg.content,
                contentType: msg.contentType,
              })),
              botName: botSettings.botName,
              botRole: botSettings.botRole,
            });

            const { text: awaitingResponse } = await generateText({
              prompt,
              generationName: "telegram-awaiting-pin",
              entityId: tempConv.id,
              metadata: {
                candidateName: firstName,
              },
            });

            const [botMsg] = await db
              .insert(telegramMessage)
              .values({
                conversationId: tempConv.id,
                sender: "BOT",
                contentType: "TEXT",
                content: awaitingResponse,
              })
              .returning();

            if (botMsg && username) {
              await inngest.send({
                name: "telegram/message.send.by-username",
                data: {
                  messageId: botMsg.id,
                  username,
                  content: awaitingResponse,
                  workspaceId,
                },
              });
            }
          }

          return { identified: false, awaitingPin: true };
        });
      } else if (
        messageData.media?.type === "voice" ||
        messageData.media?.type === "audio"
      ) {
        await step.run("handle-unidentified-media", async () => {
          const [tempConv] = await db
            .insert(telegramConversation)
            .values({
              chatId,
              candidateName: firstName,
              username,
              status: "ACTIVE",
              metadata: JSON.stringify({
                identifiedBy: "none",
                awaitingPin: true,
              }),
            })
            .onConflictDoNothing()
            .returning();

          if (tempConv) {
            await db.insert(telegramMessage).values({
              conversationId: tempConv.id,
              sender: "CANDIDATE",
              contentType: "VOICE",
              content: "Голосовое сообщение (кандидат не идентифицирован)",
              telegramMessageId: messageData.id.toString(),
            });

            // Получаем историю для контекста
            const conversationHistory = await db.query.telegramMessage.findMany(
              {
                where: eq(telegramMessage.conversationId, tempConv.id),
                orderBy: (messages, { asc }) => [asc(messages.createdAt)],
                limit: 10,
              },
            );

            // Генерируем ответ через AI для голосового без PIN
            const prompt = buildTelegramRecruiterPrompt({
              messageText: "[Голосовое сообщение]",
              stage: "AWAITING_PIN",
              candidateName: firstName,
              conversationHistory: conversationHistory.map((msg) => ({
                sender: msg.sender,
                content: msg.content,
                contentType: msg.contentType,
              })),
              botName: botSettings.botName,
              botRole: botSettings.botRole,
            });

            const { text: errorMessage } = await generateText({
              prompt,
              generationName: "telegram-voice-awaiting-pin",
              entityId: tempConv.id,
              metadata: {
                candidateName: firstName,
              },
            });

            const [botMsg] = await db
              .insert(telegramMessage)
              .values({
                conversationId: tempConv.id,
                sender: "BOT",
                contentType: "TEXT",
                content: errorMessage,
              })
              .returning();

            if (botMsg && username) {
              await inngest.send({
                name: "telegram/message.send.by-username",
                data: {
                  messageId: botMsg.id,
                  username,
                  content: errorMessage,
                  workspaceId,
                },
              });
            }
          }
        });
      }

      return { processed: true, identified: false };
    }

    // Обработка идентифицированных сообщений
    if (messageData.text) {
      // Проверяем дубликаты ДО step.run, чтобы можно было вернуть результат из основной функции
      const isDuplicate = await step.run("check-duplicate-text", async () => {
        return await findDuplicateMessage(
          conversation.id,
          messageData.id.toString(),
        );
      });

      if (isDuplicate) {
        console.log("⏭️ Сообщение уже обработано, пропускаем", {
          conversationId: conversation.id,
          telegramMessageId: messageData.id.toString(),
        });
        return { skipped: true, reason: "duplicate message" };
      }

      await step.run("handle-identified-text", async () => {
        const text = messageData.text || "";

        // Вставляем новое сообщение
        const [savedMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "CANDIDATE",
            contentType: "TEXT",
            content: text,
            telegramMessageId: messageData.id.toString(),
          })
          .returning();

        // Проверяем статус беседы - если кандидат идентифицирован и интервью активно, запускаем анализ
        if (
          conversation.responseId &&
          conversation.status === "ACTIVE" &&
          savedMessage
        ) {
          // Безопасный парсинг метаданных с fallback
          let metadata: {
            interviewStarted?: boolean;
            interviewCompleted?: boolean;
          } = {};

          if (conversation.metadata) {
            try {
              metadata = JSON.parse(conversation.metadata) as {
                interviewStarted?: boolean;
                interviewCompleted?: boolean;
              };
            } catch (error) {
              console.error(
                "❌ Ошибка парсинга metadata, используем пустой объект",
                {
                  conversationId: conversation.id,
                  error,
                },
              );
            }
          }

          if (
            metadata.interviewStarted === true &&
            metadata.interviewCompleted !== true
          ) {
            console.log("🚀 Запуск анализа интервью для текстового сообщения", {
              conversationId: conversation.id,
              messageId: savedMessage.id,
            });

            await inngest.send({
              name: "telegram/interview.analyze",
              data: {
                conversationId: conversation.id,
                transcription: text,
              },
            });

            console.log("✅ Событие анализа интервью отправлено");
          }
        }
      });
    } else if (messageData.media?.type === "voice") {
      // Проверяем дубликаты ДО step.run
      const isDuplicate = await step.run("check-duplicate-voice", async () => {
        return await findDuplicateMessage(
          conversation.id,
          messageData.id.toString(),
        );
      });

      if (isDuplicate) {
        console.log("⏭️ Голосовое сообщение уже обработано, пропускаем", {
          conversationId: conversation.id,
          telegramMessageId: messageData.id.toString(),
        });
        return { skipped: true, reason: "duplicate voice message" };
      }

      await step.run("handle-voice", async () => {
        // Скачиваем файл и загружаем в S3 через tg-client SDK
        const downloadData = await tgClientSDK.downloadFile({
          workspaceId,
          chatId: Number.parseInt(chatId, 10),
          messageId: messageData.id,
        });

        // Сохраняем сообщение в базу с fileId из S3
        const [savedMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "CANDIDATE",
            contentType: "VOICE",
            content: "Голосовое сообщение",
            fileId: downloadData.fileId,
            voiceDuration: downloadData.duration.toString(),
            telegramMessageId: messageData.id.toString(),
          })
          .returning();

        // Триггерим транскрибацию с ID сообщения из нашей базы
        if (savedMessage) {
          await inngest.send({
            name: "telegram/voice.transcribe",
            data: {
              messageId: savedMessage.id,
              fileId: downloadData.fileId,
            },
          });
        }
      });
    } else if (messageData.media?.type === "audio") {
      // Проверяем дубликаты ДО step.run
      const isDuplicate = await step.run("check-duplicate-audio", async () => {
        return await findDuplicateMessage(
          conversation.id,
          messageData.id.toString(),
        );
      });

      if (isDuplicate) {
        console.log("⏭️ Аудио сообщение уже обработано, пропускаем", {
          conversationId: conversation.id,
          telegramMessageId: messageData.id.toString(),
        });
        return { skipped: true, reason: "duplicate audio message" };
      }

      await step.run("handle-audio", async () => {
        // Скачиваем файл и загружаем в S3 через tg-client SDK
        const downloadData = await tgClientSDK.downloadFile({
          workspaceId,
          chatId: Number.parseInt(chatId, 10),
          messageId: messageData.id,
        });

        // Сохраняем сообщение в базу с fileId из S3
        const [savedMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "CANDIDATE",
            contentType: "VOICE",
            content: "Аудио сообщение",
            fileId: downloadData.fileId,
            voiceDuration: downloadData.duration.toString(),
            telegramMessageId: messageData.id.toString(),
          })
          .returning();

        // Триггерим транскрибацию с ID сообщения из нашей базы
        if (savedMessage) {
          await inngest.send({
            name: "telegram/voice.transcribe",
            data: {
              messageId: savedMessage.id,
              fileId: downloadData.fileId,
            },
          });
        }
      });
    }

    return { processed: true, identified: true };
  },
);
