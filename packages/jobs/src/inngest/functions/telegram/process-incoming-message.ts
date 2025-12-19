import { db } from "@qbs-autonaim/db/client";
import { RESPONSE_STATUS } from "@qbs-autonaim/db/schema";
import { conversationMessagesChannel } from "../../channels/client";
import { inngest } from "../../client";
import {
  handleIdentifiedMedia,
  handleIdentifiedText,
} from "./handlers/identified";
import {
  handleUnidentifiedMedia,
  handleUnidentifiedText,
} from "./handlers/unidentified";
import {
  formatMessageGroup,
  shouldProcessMessageGroup,
} from "./message-grouping";
import type { MessagePayload } from "./types";
import { findDuplicateMessage, getCompanyBotSettings } from "./utils";

export const processIncomingMessageFunction = inngest.createFunction(
  {
    id: "telegram-process-incoming-message",
    name: "Process Incoming Telegram Message",
    retries: 3,
  },
  { event: "telegram/message.received" },
  async ({ event, step, publish }) => {
    const { workspaceId, messageData } = event.data as MessagePayload;

    console.log("📨 Получено входящее сообщение", {
      workspaceId,
      messageId: messageData.id,
      chatId: messageData.chatId,
      isOutgoing: messageData.isOutgoing,
      hasText: !!messageData.text,
      mediaType: messageData.media?.type,
      sender: {
        type: messageData.sender?.type,
        username: messageData.sender?.username,
        firstName: messageData.sender?.firstName,
      },
    });

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
    const conv = await step.run("check-conversation", async () => {
      // Сначала пробуем найти по username
      if (username) {
        const byUsername = await db.query.conversation.findFirst({
          where: (fields, { eq }) => eq(fields.username, username),
          with: {
            response: true,
          },
        });
        if (byUsername) {
          console.log("✅ Conversation найден по username", {
            conversationId: byUsername.id,
            username,
          });
          return byUsername;
        }
      }

      // Если не нашли по username, ищем по metadata.senderId (Telegram chat ID)
      const allConversations = await db.query.conversation.findMany({
        where: (fields, { eq }) => eq(fields.status, "ACTIVE"),
        with: {
          response: true,
        },
      });

      const byMetadata = allConversations.find((c) => {
        try {
          const metadata = c.metadata ? JSON.parse(c.metadata) : null;
          return metadata?.senderId === chatId.toString();
        } catch {
          return false;
        }
      });

      if (byMetadata) {
        console.log("✅ Conversation найден по metadata.senderId", {
          conversationId: byMetadata.id,
          chatId,
        });
      } else {
        console.log("❌ Conversation не найден", {
          username,
          chatId,
          activeConversationsCount: allConversations.length,
        });
      }

      return byMetadata || null;
    });

    const isIdentified = conv?.responseId != null;

    console.log("🔍 Результат проверки идентификации", {
      isIdentified,
      conversationId: conv?.id,
      responseId: conv?.responseId,
      status: conv?.status,
    });

    // Проверяем статус response если кандидат идентифицирован
    if (isIdentified && conv.response) {
      const responseStatus = conv.response.status;
      const isInterviewRelated =
        responseStatus === RESPONSE_STATUS.EVALUATED ||
        responseStatus === RESPONSE_STATUS.NEW ||
        responseStatus === RESPONSE_STATUS.INTERVIEW_HH ||
        responseStatus === RESPONSE_STATUS.COMPLETED;

      if (!isInterviewRelated) {
        console.log(
          "⏭️ Кандидат идентифицирован, но статус не связан с интервью, пропускаем",
          {
            conversationId: conv.id,
            responseStatus,
          },
        );
        return { skipped: true, reason: "status not interview-related" };
      }
    }

    // Обработка неидентифицированных сообщений
    if (!isIdentified) {
      if (messageData.text) {
        return await step.run("handle-unidentified-text", async () => {
          return await handleUnidentifiedText({
            chatId,
            text: messageData.text || "",
            messageId: messageData.id.toString(),
            username,
            firstName,
            workspaceId,
            botSettings,
          });
        });
      }

      if (
        messageData.media?.type === "voice" ||
        messageData.media?.type === "audio"
      ) {
        return await step.run("handle-unidentified-media", async () => {
          return await handleUnidentifiedMedia({
            chatId,
            messageId: messageData.id.toString(),
            firstName,
            workspaceId,
            botSettings,
          });
        });
      }

      return { processed: true, identified: false };
    }

    // Обработка идентифицированных сообщений
    if (messageData.text) {
      const isDuplicate = await step.run("check-duplicate-text", async () => {
        return await findDuplicateMessage(conv.id, messageData.id.toString());
      });

      if (isDuplicate) {
        console.log("⏭️ Сообщение уже обработано, пропускаем", {
          conversationId: conv.id,
          conversationMessageId: messageData.id.toString(),
        });
        return { skipped: true, reason: "duplicate message" };
      }

      // Проверяем группировку сообщений
      const groupCheck = await step.run("check-message-grouping", async () => {
        return await shouldProcessMessageGroup(
          conv.id,
          messageData.id.toString(),
        );
      });

      if (!groupCheck.shouldProcess) {
        console.log("⏳ Ждем завершения группы сообщений", {
          conversationId: conv.id,
          messageId: messageData.id.toString(),
          reason: groupCheck.reason,
        });

        // Откладываем обработку - ждем еще сообщений
        // Для голосовых ждем дольше (65 сек), для текстовых меньше (20 сек)
        const hasVoice = groupCheck.messages.some(
          (m) => m.contentType === "VOICE",
        );
        await step.sleep("wait-for-more-messages", hasVoice ? "65s" : "20s");

        // Повторно проверяем после ожидания
        const recheckGroup = await step.run(
          "recheck-message-grouping",
          async () => {
            return await shouldProcessMessageGroup(
              conv.id,
              messageData.id.toString(),
            );
          },
        );

        if (!recheckGroup.shouldProcess) {
          console.log("⏭️ Сообщение не последнее в группе, пропускаем", {
            conversationId: conv.id,
            messageId: messageData.id.toString(),
            reason: recheckGroup.reason,
          });
          return { skipped: true, reason: "not last in group" };
        }

        // Обрабатываем группу
        const groupedText = formatMessageGroup(recheckGroup.messages);
        console.log("📦 Обрабатываем группу сообщений", {
          conversationId: conv.id,
          messagesCount: recheckGroup.messages.length,
          groupedText: groupedText.substring(0, 100),
        });

        await step.run("handle-identified-text-group", async () => {
          await handleIdentifiedText({
            conversationId: conv.id,
            text: groupedText,
            messageId: messageData.id.toString(),
            responseId: conv.responseId,
            status: conv.status,
            metadata: conv.metadata,
          });
        });

        await publish(
          conversationMessagesChannel(conv.id).message({
            conversationId: conv.id,
            messageId: messageData.id.toString(),
          }),
        );

        return { processed: true, identified: true, grouped: true };
      }

      // Обрабатываем сразу (единственное сообщение или группа готова)
      const textToProcess =
        groupCheck.messages.length > 1
          ? formatMessageGroup(groupCheck.messages)
          : messageData.text || "";

      console.log("✅ Обрабатываем сообщение", {
        conversationId: conv.id,
        messageId: messageData.id.toString(),
        isGroup: groupCheck.messages.length > 1,
        messagesCount: groupCheck.messages.length,
      });

      await step.run("handle-identified-text", async () => {
        await handleIdentifiedText({
          conversationId: conv.id,
          text: textToProcess,
          messageId: messageData.id.toString(),
          responseId: conv.responseId,
          status: conv.status,
          metadata: conv.metadata,
        });
      });

      await publish(
        conversationMessagesChannel(conv.id).message({
          conversationId: conv.id,
          messageId: messageData.id.toString(),
        }),
      );

      return { processed: true, identified: true };
    }

    const mediaType = messageData.media?.type;
    if (mediaType === "voice" || mediaType === "audio") {
      console.log(
        `🎤 Обработка ${mediaType === "voice" ? "голосового" : "аудио"} сообщения`,
        {
          conversationId: conv.id,
          messageId: messageData.id.toString(),
          chatId,
          workspaceId,
        },
      );

      const isDuplicate = await step.run(
        `check-duplicate-${mediaType}`,
        async () => {
          return await findDuplicateMessage(conv.id, messageData.id.toString());
        },
      );

      if (isDuplicate) {
        console.log(
          `⏭️ ${mediaType === "voice" ? "Голосовое" : "Аудио"} сообщение уже обработано, пропускаем`,
          {
            conversationId: conv.id,
            conversationMessageId: messageData.id.toString(),
          },
        );
        return { skipped: true, reason: `duplicate ${mediaType} message` };
      }

      // Проверяем группировку голосовых сообщений
      const groupCheck = await step.run(
        "check-voice-message-grouping",
        async () => {
          return await shouldProcessMessageGroup(
            conv.id,
            messageData.id.toString(),
          );
        },
      );

      if (!groupCheck.shouldProcess) {
        console.log("⏳ Ждем завершения группы голосовых сообщений", {
          conversationId: conv.id,
          messageId: messageData.id.toString(),
          reason: groupCheck.reason,
        });

        // Откладываем обработку голосовых (60 сек + запас)
        await step.sleep("wait-for-more-voice-messages", "65s");

        // Повторно проверяем
        const recheckGroup = await step.run(
          "recheck-voice-message-grouping",
          async () => {
            return await shouldProcessMessageGroup(
              conv.id,
              messageData.id.toString(),
            );
          },
        );

        if (!recheckGroup.shouldProcess) {
          console.log("⏭️ Голосовое не последнее в группе, пропускаем", {
            conversationId: conv.id,
            messageId: messageData.id.toString(),
            reason: recheckGroup.reason,
          });
          return { skipped: true, reason: "not last voice in group" };
        }

        console.log("📦 Обрабатываем группу голосовых", {
          conversationId: conv.id,
          messagesCount: recheckGroup.messages.length,
        });
      }

      console.log(`✅ Обрабатываем ${mediaType} сообщение`, {
        conversationId: conv.id,
        messageId: messageData.id.toString(),
        isGroup: groupCheck.messages.length > 1,
        messagesCount: groupCheck.messages.length,
      });

      await step.run(`handle-${mediaType}`, async () => {
        await handleIdentifiedMedia({
          conversationId: conv.id,
          chatId,
          messageId: messageData.id,
          messageIdStr: messageData.id.toString(),
          mediaType,
          workspaceId,
          responseId: conv.responseId,
        });
      });

      await publish(
        conversationMessagesChannel(conv.id).message({
          conversationId: conv.id,
          messageId: messageData.id.toString(),
        }),
      );

      return { processed: true, identified: true };
    }

    return { processed: true, identified: true };
  },
);
