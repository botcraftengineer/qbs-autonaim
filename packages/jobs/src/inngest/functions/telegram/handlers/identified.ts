import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../../client";
import type { ConversationMetadata } from "../types";

export async function handleIdentifiedText(params: {
  conversationId: string;
  text: string;
  messageId: string;
  responseId: string | null;
  status: string;
  metadata: string | null;
}) {
  const { conversationId, text, messageId, responseId, status, metadata } =
    params;

  const [savedMessage] = await db
    .insert(conversationMessage)
    .values({
      conversationId,
      sender: "CANDIDATE",
      contentType: "TEXT",
      content: text,
      externalMessageId: messageId,
    })
    .returning();

  if (responseId && status === "ACTIVE" && savedMessage) {
    let parsedMetadata: ConversationMetadata = {};

    if (metadata) {
      try {
        parsedMetadata = JSON.parse(metadata) as ConversationMetadata;
      } catch (error) {
        console.error("❌ Ошибка парсинга metadata, используем пустой объект", {
          conversationId,
          error,
        });
      }
    }

    if (
      parsedMetadata.interviewStarted === true &&
      parsedMetadata.interviewCompleted !== true
    ) {
      console.log("🚀 Запуск анализа интервью для текстового сообщения", {
        conversationId,
        messageId: savedMessage.id,
      });

      await inngest.send({
        name: "telegram/interview.analyze",
        data: {
          conversationId,
          transcription: text,
        },
      });

      console.log("✅ Событие анализа интервью отправлено");
    }
  }
}

export async function handleIdentifiedMedia(params: {
  conversationId: string;
  chatId: string;
  messageId: number;
  messageIdStr: string;
  mediaType: "voice" | "audio";
  workspaceId: string;
}) {
  const {
    conversationId,
    chatId,
    messageId,
    messageIdStr,
    mediaType,
    workspaceId,
  } = params;

  console.log(`📥 Начинаем скачивание ${mediaType === "voice" ? "голосового" : "аудио"} файла`, {
    conversationId,
    chatId,
    messageId,
    workspaceId,
  });

  const downloadData = await tgClientSDK.downloadFile({
    workspaceId,
    chatId: Number.parseInt(chatId, 10),
    messageId,
  });

  console.log(`✅ Файл успешно скачан`, {
    conversationId,
    fileId: downloadData.fileId,
    duration: downloadData.duration,
  });

  const [savedMessage] = await db
    .insert(conversationMessage)
    .values({
      conversationId,
      sender: "CANDIDATE",
      contentType: "VOICE",
      content: `${mediaType === "voice" ? "Голосовое" : "Аудио"} сообщение`,
      fileId: downloadData.fileId,
      voiceDuration: downloadData.duration.toString(),
      externalMessageId: messageIdStr,
    })
    .returning();

  console.log(`💾 Сообщение сохранено в БД`, {
    conversationId,
    messageId: savedMessage?.id,
    fileId: downloadData.fileId,
    externalMessageId: messageIdStr,
  });

  if (savedMessage) {
    console.log(`🚀 Отправка события транскрибации`, {
      messageId: savedMessage.id,
      fileId: downloadData.fileId,
    });

    await inngest.send({
      name: "telegram/voice.transcribe",
      data: {
        messageId: savedMessage.id,
        fileId: downloadData.fileId,
      },
    });

    console.log(`✅ Событие транскрибации отправлено`);
  } else {
    console.error(`❌ Не удалось сохранить сообщение в БД`, {
      conversationId,
      externalMessageId: messageIdStr,
    });
  }
}
