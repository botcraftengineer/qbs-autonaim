import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import {
  interviewMessage,
  RESPONSE_STATUS,
  vacancyResponse,
} from "@qbs-autonaim/db/schema";
import { tgClientSDK } from "@qbs-autonaim/tg-client/sdk";
import { inngest } from "../../../client";
import type { ChatSessionMetadata } from "../types";

/**
 * Сохраняет текстовое сообщение в БД
 * НЕ отправляет на анализ — это делает process-incoming-message после проверки группировки
 */
export async function saveIdentifiedText(params: {
  chatSessionId: string;
  text: string;
  messageId: string;
}) {
  const { chatSessionId, text, messageId } = params;

  const [savedMessage] = await db
    .insert(interviewMessage)
    .values({
      sessionId: chatSessionId,
      role: "user",
      type: "text",
      content: text,
      externalId: messageId,
      channel: "telegram",
    })
    .returning();

  console.log("💾 Текстовое сообщение сохранено в БД", {
    chatSessionId,
    messageId: savedMessage?.id,
    externalId: messageId,
  });

  return savedMessage;
}

/**
 * Отправляет событие анализа интервью для сгруппированных сообщений
 */
export async function triggerTextAnalysis(params: {
  chatSessionId: string;
  text: string;
  responseId: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
}) {
  const { chatSessionId, text, responseId, status } = params;

  if (!responseId || status !== "active") {
    console.log("⏭️ Пропускаем анализ: не активный response", {
      chatSessionId,
      responseId,
      status,
    });
    return;
  }

  const parsedMetadata: ChatSessionMetadata = (params.metadata ||
    {}) as ChatSessionMetadata;

  if (
    parsedMetadata.interviewStarted === true &&
    parsedMetadata.interviewCompleted !== true
  ) {
    // Устанавливаем статус INTERVIEW при первом сообщении
    await updateStatusOnFirstMessage(chatSessionId, responseId);

    console.log("🚀 Запуск анализа интервью для группы сообщений", {
      chatSessionId,
      textLength: text.length,
    });

    await inngest.send({
      name: "telegram/interview.analyze",
      data: {
        chatSessionId,
        transcription: text,
      },
    });

    console.log("✅ Событие анализа интервью отправлено");
  }
}

/**
 * @deprecated Используйте saveIdentifiedText + triggerTextAnalysis
 * Оставлено для обратной совместимости
 */
export async function handleIdentifiedText(params: {
  chatSessionId: string;
  text: string;
  messageId: string;
  responseId: string | null;
  status: string;
  metadata: Record<string, unknown> | null;
}) {
  const { chatSessionId, text, messageId, responseId, status, metadata } =
    params;

  await saveIdentifiedText({ chatSessionId, text, messageId });
  await triggerTextAnalysis({
    chatSessionId,
    text,
    responseId,
    status,
    metadata,
  });
}

export async function handleIdentifiedMedia(params: {
  chatSessionId: string;
  chatId: string;
  messageId: number;
  messageIdStr: string;
  mediaType: "voice" | "audio";
  workspaceId: string;
  responseId?: string | null;
}) {
  const {
    chatSessionId,
    chatId,
    messageId,
    messageIdStr,
    mediaType,
    workspaceId,
    // responseId используется в transcribe-voice.ts для установки статуса
  } = params;

  console.log(
    `📥 Начинаем скачивание ${mediaType === "voice" ? "голосового" : "аудио"} файла`,
    {
      chatSessionId,
      chatId,
      messageId,
      workspaceId,
    },
  );

  const downloadData = await tgClientSDK.downloadFile({
    workspaceId,
    chatId: Number.parseInt(chatId, 10),
    messageId,
  });

  console.log(`✅ Файл успешно скачан`, {
    chatSessionId,
    fileId: downloadData.fileId,
    duration: downloadData.duration,
  });

  const [savedMessage] = await db
    .insert(interviewMessage)
    .values({
      sessionId: chatSessionId,
      role: "user",
      type: "voice",
      content: `${mediaType === "voice" ? "Голосовое" : "Аудио"} сообщение`,
      fileId: downloadData.fileId,
      voiceDuration: downloadData.duration,
      externalId: messageIdStr,
      channel: "telegram",
    })
    .returning();

  console.log(`💾 Сообщение сохранено в БД`, {
    chatSessionId,
    messageId: savedMessage?.id,
    fileId: downloadData.fileId,
    externalId: messageIdStr,
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
      chatSessionId,
      externalId: messageIdStr,
    });
  }
}

async function updateStatusOnFirstMessage(
  chatSessionId: string,
  responseId: string,
) {
  // Проверяем, это ли первое сообщение от кандидата
  const candidateMessagesCount = await db.query.interviewMessage.findMany({
    where: (fields, { and, eq }) =>
      and(eq(fields.sessionId, chatSessionId), eq(fields.role, "user")),
  });

  // Если это первое сообщение, устанавливаем статус INTERVIEW
  if (candidateMessagesCount.length === 1) {
    const response = await db.query.vacancyResponse.findFirst({
      where: eq(vacancyResponse.id, responseId),
    });

    if (
      response &&
      (response.status === RESPONSE_STATUS.NEW ||
        response.status === RESPONSE_STATUS.EVALUATED)
    ) {
      await db
        .update(vacancyResponse)
        .set({ status: RESPONSE_STATUS.INTERVIEW })
        .where(eq(vacancyResponse.id, responseId));

      console.log("✅ Статус изменен на INTERVIEW (первое сообщение)", {
        chatSessionId,
        responseId,
        previousStatus: response.status,
      });
    }
  }
}
