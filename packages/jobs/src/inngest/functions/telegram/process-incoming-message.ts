import { db } from "@qbs-autonaim/db/client";
import { RESPONSE_STATUS } from "@qbs-autonaim/db/schema";
import { messageBufferService } from "@qbs-autonaim/jobs/services/buffer";
import { handleIncomingMessage } from "@qbs-autonaim/tg-client/handlers/message-handler";
import { chatSessionMessagesChannel } from "../../channels/client";
import { inngest } from "../../client";
import {
  handleIdentifiedMedia,
  saveIdentifiedText,
  triggerTextAnalysis,
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

    // Проверяем идентификацию через interviewSession
    const sessionData = await step.run("check-interview-session", async () => {
      // Сначала пробуем найти response по chatId
      const responseRecord = await db.query.response.findFirst({
        where: (fields, { eq }) => eq(fields.chatId, chatId),
      });

      if (!responseRecord) {
        console.log("❌ Response не найден по chatId", { chatId });
        return null;
      }

      // Ищем interviewSession по responseId
      const session = await db.query.interviewSession.findFirst({
        where: (fields, { eq }) => eq(fields.responseId, responseRecord.id),
      });

      if (session) {
        console.log("✅ InterviewSession найден", {
          interviewSessionId: session.id,
          responseId: responseRecord.id,
        });
        return {
          session,
          response: responseRecord,
        };
      }

      console.log("❌ InterviewSession не найден для response", {
        responseId: responseRecord.id,
      });
      return null;
    });

    const isIdentified = sessionData?.response != null;

    console.log("🔍 Результат проверки идентификации", {
      isIdentified,
      interviewSessionId: sessionData?.session?.id,
      responseId: sessionData?.response?.id,
      status: sessionData?.session?.status,
    });

    // Проверяем статус response если кандидат идентифицирован
    if (isIdentified && sessionData.response) {
      const responseStatus = sessionData.response.status;
      const isInterviewRelated =
        responseStatus === RESPONSE_STATUS.EVALUATED ||
        responseStatus === RESPONSE_STATUS.NEW ||
        responseStatus === RESPONSE_STATUS.INTERVIEW;

      if (!isInterviewRelated) {
        console.log(
          "⏭️ Кандидат идентифицирован, но статус не связан с интервью, пропускаем",
          {
            chatSessionId: sessionData.session?.id,
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

    const interviewSessionId = sessionData.session?.id;

    // Обработка идентифицированных сообщений
    if (messageData.text) {
      const isDuplicate = await step.run("check-duplicate-text", async () => {
        return await findDuplicateMessage(
          interviewSessionId,
          messageData.id.toString(),
        );
      });

      if (isDuplicate) {
        console.log("⏭️ Сообщение уже обработано, пропускаем", {
          interviewSessionId,
          messageId: messageData.id.toString(),
        });
        return { skipped: true, reason: "duplicate message" };
      }

      // Попытка буферизации сообщения (если включена)
      const bufferResult = await step.run("try-buffer-message", async () => {
        try {
          return await handleIncomingMessage({
            messageData,
            workspaceId,
            interviewSessionId,
            userId: chatId, // используем chatId как userId
            bufferService: messageBufferService,
          });
        } catch (error) {
          console.error("❌ Ошибка буферизации сообщения:", error);
          return { buffered: false, reason: "buffer error" };
        }
      });

      // 1. ВСЕГДА сохраняем сообщение в БД (независимо от буферизации)
      await step.run("save-text-message", async () => {
        await saveIdentifiedText({
          chatSessionId: interviewSessionId,
          text: messageData.text || "",
          messageId: messageData.id.toString(),
        });
      });

      // Публикуем событие о новом сообщении
      await publish(
        chatSessionMessagesChannel(interviewSessionId).message({
          chatSessionId: interviewSessionId,
          messageId: messageData.id.toString(),
        }),
      );

      // Если сообщение буферизовано, пропускаем стандартную обработку
      if (bufferResult.buffered) {
        console.log(
          "✅ Сообщение сохранено и буферизовано, стандартная обработка пропущена",
          {
            interviewSessionId,
            messageId: messageData.id.toString(),
            interviewStep: bufferResult.interviewStep,
          },
        );
        return {
          processed: true,
          identified: true,
          buffered: true,
          interviewStep: bufferResult.interviewStep,
        };
      }

      console.log(
        "ℹ️ Буферизация не применена, используем стандартную обработку",
        {
          interviewSessionId,
          reason: bufferResult.reason,
        },
      );

      // 2. Проверяем группировку сообщений (сообщение уже в БД)
      const groupCheck = await step.run("check-message-grouping", async () => {
        return await shouldProcessMessageGroup(
          interviewSessionId,
          messageData.id.toString(),
        );
      });

      if (!groupCheck.shouldProcess) {
        console.log("⏳ Ждем завершения группы сообщений", {
          interviewSessionId,
          messageId: messageData.id.toString(),
          reason: groupCheck.reason,
        });

        // Откладываем обработку - ждем еще сообщений
        // Для голосовых ждем дольше (65 сек), для текстовых меньше (20 сек)
        // Также ждём, если есть голосовые без транскрипции
        const isWaitingForVoice = groupCheck.reason?.includes("voice");
        await step.sleep(
          "wait-for-more-messages",
          isWaitingForVoice ? "65s" : "20s",
        );

        // Повторно проверяем после ожидания
        const recheckGroup = await step.run(
          "recheck-message-grouping",
          async () => {
            return await shouldProcessMessageGroup(
              interviewSessionId,
              messageData.id.toString(),
            );
          },
        );

        if (!recheckGroup.shouldProcess) {
          console.log(
            "⏭️ Сообщение не последнее в группе или ждём транскрипции, пропускаем",
            {
              interviewSessionId,
              messageId: messageData.id.toString(),
              reason: recheckGroup.reason,
            },
          );
          return {
            skipped: true,
            reason: recheckGroup.reason || "not last in group",
          };
        }

        // 3. Обрабатываем группу - отправляем на анализ
        const groupedText = formatMessageGroup(recheckGroup.messages);
        console.log("📦 Обрабатываем группу сообщений", {
          interviewSessionId,
          messagesCount: recheckGroup.messages.length,
          groupedText: groupedText.substring(0, 100),
        });

        await step.run("trigger-text-analysis-group", async () => {
          await triggerTextAnalysis({
            chatSessionId: interviewSessionId,
            text: groupedText,
            responseId: sessionData.response?.id,
            status: sessionData.session?.status,
            metadata: sessionData.session?.metadata,
          });
        });

        return { processed: true, identified: true, grouped: true };
      }

      // Группа готова или единственное сообщение - обрабатываем сразу
      const textToProcess =
        groupCheck.messages.length > 1
          ? formatMessageGroup(groupCheck.messages)
          : messageData.text || "";

      console.log("✅ Обрабатываем сообщение", {
        interviewSessionId,
        messageId: messageData.id.toString(),
        isGroup: groupCheck.messages.length > 1,
        messagesCount: groupCheck.messages.length,
      });

      await step.run("trigger-text-analysis", async () => {
        await triggerTextAnalysis({
          chatSessionId: interviewSessionId,
          text: textToProcess,
          responseId: sessionData.response?.id,
          status: sessionData.session?.status,
          metadata: sessionData.session?.metadata,
        });
      });

      return { processed: true, identified: true };
    }

    const mediaType = messageData.media?.type;
    if (mediaType === "voice" || mediaType === "audio") {
      console.log(
        `🎤 Обработка ${mediaType === "voice" ? "голосового" : "аудио"} сообщения`,
        {
          interviewSessionId,
          messageId: messageData.id.toString(),
          chatId,
          workspaceId,
        },
      );

      const isDuplicate = await step.run(
        `check-duplicate-${mediaType}`,
        async () => {
          return await findDuplicateMessage(
            interviewSessionId,
            messageData.id.toString(),
          );
        },
      );

      if (isDuplicate) {
        console.log(
          `⏭️ ${mediaType === "voice" ? "Голосовое" : "Аудио"} сообщение уже обработано, пропускаем`,
          {
            interviewSessionId,
            messageId: messageData.id.toString(),
          },
        );
        return { skipped: true, reason: `duplicate ${mediaType} message` };
      }

      // Голосовые сразу отправляем на транскрибацию
      // Группировка проверяется в transcribe-voice.ts после получения транскрипции
      console.log(`✅ Отправляем ${mediaType} на транскрибацию`, {
        interviewSessionId,
        messageId: messageData.id.toString(),
      });

      await step.run(`handle-${mediaType}`, async () => {
        await handleIdentifiedMedia({
          chatSessionId: interviewSessionId,
          chatId,
          messageId: messageData.id,
          messageIdStr: messageData.id.toString(),
          mediaType,
          workspaceId,
          responseId: sessionData.response?.id,
        });
      });

      await publish(
        chatSessionMessagesChannel(interviewSessionId).message({
          chatSessionId: interviewSessionId,
          messageId: messageData.id.toString(),
        }),
      );

      return { processed: true, identified: true };
    }

    return { processed: true, identified: true };
  },
);
