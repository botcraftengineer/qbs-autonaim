import { db } from "@qbs-autonaim/db/client";
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
        if (byUsername) return byUsername;
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

      return byMetadata || null;
    });

    const isIdentified = conv?.responseId != null;

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

      await step.run("handle-identified-text", async () => {
        await handleIdentifiedText({
          conversationId: conv.id,
          text: messageData.text || "",
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

      await step.run(`handle-${mediaType}`, async () => {
        await handleIdentifiedMedia({
          conversationId: conv.id,
          chatId,
          messageId: messageData.id,
          messageIdStr: messageData.id.toString(),
          mediaType,
          workspaceId,
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
