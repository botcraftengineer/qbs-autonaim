import type { TelegramClient } from "@mtcute/bun";
import type { Message } from "@mtcute/core";
import { eq } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { telegramConversation, telegramMessage } from "@qbs-autonaim/db/schema";
import { getErrorResponse } from "../responses/greetings";
import { uploadFile } from "../utils/file-upload";
import { triggerMessageSend, triggerTranscription } from "../utils/inngest";
import { markRead, showRecordingAudio } from "../utils/telegram";

export async function handleVoiceMessage(
  client: TelegramClient,
  message: Message,
): Promise<void> {
  const chatId = message.chat.id.toString();
  console.log("handleVoiceMessage", chatId);

  if (!message.media || message.media.type !== "voice") {
    return;
  }

  const [conversation] = await db
    .select()
    .from(telegramConversation)
    .where(eq(telegramConversation.chatId, chatId))
    .limit(1);

  // Если беседа не найдена или пользователь не идентифицирован (нет responseId)
  if (!conversation || !conversation.responseId) {
    await markRead(client, message.chat.id);

    const errorMessage =
      "Привет! Не могу вспомнить, откуда мы знакомы. Напомнишь?";

    const sender = message.sender;
    let username: string | undefined;
    let firstName: string | undefined;
    if (sender && "username" in sender && sender.username) {
      username = sender.username;
    }
    if (sender?.type === "user") {
      firstName = sender.firstName || undefined;
    }

    // Создаем временную беседу
    const [tempConversation] = await db
      .insert(telegramConversation)
      .values({
        chatId,
        candidateName: firstName || undefined,
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
          username,
          status: "ACTIVE",
          metadata: JSON.stringify({
            identifiedBy: "none",
            awaitingPin: true,
          }),
        },
      })
      .returning();

    if (tempConversation) {
      // Сохраняем голосовое сообщение пользователя
      await db.insert(telegramMessage).values({
        conversationId: tempConversation.id,
        sender: "CANDIDATE",
        contentType: "VOICE",
        content: "Голосовое сообщение (кандидат не идентифицирован)",
        telegramMessageId: message.id.toString(),
      });

      const [botMessage] = await db
        .insert(telegramMessage)
        .values({
          conversationId: tempConversation.id,
          sender: "BOT",
          contentType: "TEXT",
          content: errorMessage,
        })
        .returning();

      if (botMessage && username) {
        await triggerMessageSend(botMessage.id, username, errorMessage);
      }
    }

    return;
  }

  await markRead(client, message.chat.id);

  try {
    await showRecordingAudio(client, message.chat.id);

    const fileBuffer = await client.downloadAsBuffer(message.media);
    const fileName = `voice_${message.id}.ogg`;
    const mimeType = message.media.mimeType || "audio/ogg";

    const fileId = await uploadFile(
      Buffer.from(fileBuffer),
      fileName,
      mimeType,
    );

    const duration =
      "duration" in message.media ? (message.media.duration as number) : 0;

    const [voiceMessage] = await db
      .insert(telegramMessage)
      .values({
        conversationId: conversation.id,
        sender: "CANDIDATE",
        contentType: "VOICE",
        content: "Голосовое сообщение",
        fileId,
        voiceDuration: duration.toString(),
        telegramMessageId: message.id.toString(),
      })
      .returning();

    if (!voiceMessage) {
      throw new Error("Не удалось создать запись сообщения");
    }

    await triggerTranscription(voiceMessage.id, fileId);
  } catch (error) {
    console.error("Ошибка при обработке голосового сообщения:", error);

    try {
      const errorMessage = getErrorResponse();

      if (conversation && conversation.username) {
        const [botMessage] = await db
          .insert(telegramMessage)
          .values({
            conversationId: conversation.id,
            sender: "BOT",
            contentType: "TEXT",
            content: errorMessage,
          })
          .returning();

        if (botMessage) {
          await triggerMessageSend(
            botMessage.id,
            conversation.username,
            errorMessage,
          );
        }
      }
    } catch (sendError) {
      console.error("Не удалось отправить сообщение об ошибке:", sendError);
    }
  }
}
