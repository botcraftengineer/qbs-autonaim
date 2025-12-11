import { desc, eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  telegramConversation,
  telegramMessage,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import {
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
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
              set: {
                username: username || undefined,
                candidateName: firstName || undefined,
              },
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

            if (identification.success && identification.conversationId) {
              await saveMessage(
                identification.conversationId,
                "CANDIDATE",
                text,
                "TEXT",
                messageData.id.toString(),
              );

              const aiResponse = `Здравствуйте${identification.candidateName ? `, ${identification.candidateName}` : ""}! Спасибо за предоставленный PIN-код. Я ваш рекрутер, и я готов обсудить с вами вакансию${identification.vacancyTitle ? ` "${identification.vacancyTitle}"` : ""}. Расскажите, пожалуйста, немного о себе и своем опыте.`;

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

              return { identified: true };
            }

            // Неверный пин-код
            const errorResponse = `К сожалению, указанный PIN-код не найден. Пожалуйста, проверьте правильность кода и попробуйте снова. PIN-код должен состоять из 4 цифр.`;

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

          // Нет пин-кода - просим его
          const awaitingResponse = `Здравствуйте${firstName ? `, ${firstName}` : ""}! Для начала работы, пожалуйста, предоставьте ваш 4-значный PIN-код, который вы получили в письме с откликом на вакансию.`;

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
          const errorMessage =
            "Привет! Не могу понять, кто ты 🤔\n\n" +
            "Напиши, пожалуйста, на какую вакансию откликался и свой 4-значный пин-код из сообщения. Тогда смогу послушать твое голосовое.";

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
      await step.run("handle-identified-text", async () => {
        const text = messageData.text || "";

        await db.insert(telegramMessage).values({
          conversationId: conversation.id,
          sender: "CANDIDATE",
          contentType: "TEXT",
          content: text,
          telegramMessageId: messageData.id.toString(),
        });

        // Простой ответ (без AI пока)
        const aiResponse = `Спасибо за ваше сообщение! Я обрабатываю информацию...`;

        const [botMsg] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "BOT",
            contentType: "TEXT",
            content: aiResponse,
          })
          .returning();

        if (botMsg && conversation.username) {
          await inngest.send({
            name: "telegram/message.send.by-username",
            data: {
              messageId: botMsg.id,
              username: conversation.username,
              content: aiResponse,
              workspaceId,
            },
          });
        }
      });
    } else if (messageData.media?.type === "voice") {
      await step.run("handle-voice", async () => {
        // Триггерим транскрибацию через отдельное событие
        await inngest.send({
          name: "telegram/voice.transcribe",
          data: {
            messageId: messageData.id.toString(),
            fileId: messageData.media?.fileId || "",
            conversationId: conversation.id,
            workspaceId,
          },
        });
      });
    } else if (messageData.media?.type === "audio") {
      await step.run("handle-audio", async () => {
        await inngest.send({
          name: "telegram/voice.transcribe",
          data: {
            messageId: messageData.id.toString(),
            fileId: messageData.media?.fileId || "",
            conversationId: conversation.id,
            workspaceId,
          },
        });
      });
    }

    return { processed: true, identified: true };
  },
);
