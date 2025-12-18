import {
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
import { inngest } from "../../../../client";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { migrateTempMessages } from "./temp-message-storage";

export async function handlePinIdentification(params: {
  pinCode: string;
  chatId: string;
  workspaceId: string;
  username?: string;
  firstName?: string;
  trimmedText: string;
  messageId: string;
  botSettings: BotSettings;
  tempConvId: string;
}) {
  const {
    pinCode,
    chatId,
    workspaceId,
    username,
    firstName,
    trimmedText,
    messageId,
    botSettings,
    tempConvId,
  } = params;

  try {
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
      // Переносим временные сообщения в основную таблицу
      await migrateTempMessages(tempConvId, identification.conversationId);

      // Сохраняем текущее сообщение с пин-кодом
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

       return { identified: true };
    }

    return { identified: false, invalidPin: true };
  } catch (error) {
    console.error("Failed to identify by pin code:", {
      chatId,
      messageId,
      pinCode,
      error: error instanceof Error ? error.message : String(error),
    });

    await handleInvalidPin({
      tempConvId,
      trimmedText,
      messageId,
      botSettings,
      username,
      firstName,
      workspaceId,
    });

    return { identified: false, error: true };
  }
}

async function handleInvalidPin(params: {
  tempConvId: string;
  trimmedText: string;
  messageId: string;
  botSettings: BotSettings;
  username?: string;
  firstName?: string;
  workspaceId: string;
}) {
  const {
    tempConvId,
    trimmedText,
    messageId,
    botSettings,
    username,
    firstName,
    workspaceId,
  } = params;

  try {
    // Сообщение уже сохранено через saveUnidentifiedMessage
    // Просто отправляем ответ бота
    await generateAndSendBotResponse({
      conversationId: tempConvId,
      messageText: trimmedText,
      stage: "INVALID_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
    });
  } catch (error) {
    console.error("Failed to handle invalid pin:", {
      conversationId: tempConvId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
