import { db } from "@qbs-autonaim/db/client";
import { telegramConversation, telegramMessage } from "@qbs-autonaim/db/schema";
import {
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
import { inngest } from "../../../client";
import { generateAndSendBotResponse } from "../bot-response";
import type { BotSettings } from "../types";
import {
  createOrUpdateTempConversation,
  extractPinCode,
  findDuplicateMessage,
} from "../utils";

export async function handleUnidentifiedText(params: {
  chatId: string;
  text: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const {
    chatId,
    text,
    messageId,
    username,
    firstName,
    workspaceId,
    botSettings,
  } = params;

  const trimmedText = text.trim();
  const pinCode = extractPinCode(trimmedText);
  const tempConv = await createOrUpdateTempConversation(
    chatId,
    username,
    firstName,
  );

  if (pinCode) {
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
        trimmedText,
        "TEXT",
        messageId,
      );

      const interviewData = await getInterviewStartData(
        identification.responseId,
      );

      await generateAndSendBotResponse({
        conversationId: identification.conversationId,
        messageText: trimmedText,
        stage: "PIN_RECEIVED",
        botSettings,
        username,
        firstName,
        workspaceId,
        interviewData,
      });

      await inngest.send({
        name: "telegram/interview.analyze",
        data: {
          conversationId: identification.conversationId,
          transcription: trimmedText,
        },
      });

      return { identified: true };
    }

    // Неверный пин-код
    if (tempConv) {
      const isDuplicate = await findDuplicateMessage(tempConv.id, messageId);

      if (!isDuplicate) {
        await db.insert(telegramMessage).values({
          conversationId: tempConv.id,
          sender: "CANDIDATE",
          contentType: "TEXT",
          content: trimmedText,
          telegramMessageId: messageId,
        });
      }

      await generateAndSendBotResponse({
        conversationId: tempConv.id,
        messageText: trimmedText,
        stage: "INVALID_PIN",
        botSettings,
        username,
        firstName,
        workspaceId,
      });
    }

    return { identified: false, invalidPin: true };
  }

  // Нет пин-кода
  if (tempConv) {
    const isDuplicate = await findDuplicateMessage(tempConv.id, messageId);

    if (!isDuplicate) {
      await db.insert(telegramMessage).values({
        conversationId: tempConv.id,
        sender: "CANDIDATE",
        contentType: "TEXT",
        content: trimmedText,
        telegramMessageId: messageId,
      });
    }

    await generateAndSendBotResponse({
      conversationId: tempConv.id,
      messageText: trimmedText,
      stage: "AWAITING_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
    });
  }

  return { identified: false, awaitingPin: true };
}

export async function handleUnidentifiedMedia(params: {
  chatId: string;
  messageId: string;
  username?: string;
  firstName?: string;
  workspaceId: string;
  botSettings: BotSettings;
}) {
  const { chatId, messageId, username, firstName, workspaceId, botSettings } =
    params;

  const tempConv = await createOrUpdateTempConversation(
    chatId,
    username,
    firstName,
  );

  if (tempConv) {
    const isDuplicate = await findDuplicateMessage(tempConv.id, messageId);

    if (!isDuplicate) {
      await db.insert(telegramMessage).values({
        conversationId: tempConv.id,
        sender: "CANDIDATE",
        contentType: "VOICE",
        content: "Голосовое сообщение (кандидат не идентифицирован)",
        telegramMessageId: messageId,
      });
    }

    await generateAndSendBotResponse({
      conversationId: tempConv.id,
      messageText: "[Голосовое сообщение]",
      stage: "AWAITING_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
    });
  }

  return { processed: true, identified: false };
}
