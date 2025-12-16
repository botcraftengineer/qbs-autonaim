import type { telegramConversation } from "@qbs-autonaim/db/schema";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { createOrUpdateTempConversation, extractPinCode } from "../../utils";
import { handlePinIdentification } from "./identify-by-pin";
import { saveUnidentifiedMessage } from "./save-message";

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

  if (!tempConv) {
    console.error("Failed to create/update temp conversation:", {
      chatId,
      messageId,
    });
    throw new Error("Failed to create temp conversation");
  }

  if (pinCode) {
    const result = await handlePinIdentification({
      pinCode,
      chatId,
      workspaceId,
      username,
      firstName,
      trimmedText,
      messageId,
      botSettings,
      tempConvId: tempConv.id,
    });

    if (result.identified) {
      return result;
    }

    // Неверный пин-код
    await saveUnidentifiedMessage({
      conversationId: tempConv.id,
      content: trimmedText,
      messageId,
    });

    await generateAndSendBotResponse({
      conversationId: tempConv.id,
      messageText: trimmedText,
      stage: "INVALID_PIN",
      botSettings,
      username,
      firstName,
      workspaceId,
    });

    return { identified: false, invalidPin: true };
  }

  // Нет пин-кода
  await saveUnidentifiedMessage({
    conversationId: tempConv.id,
    content: trimmedText,
    messageId,
  });

  await generateAndSendBotResponse({
    conversationId: tempConv.id,
    messageText: trimmedText,
    stage: "AWAITING_PIN",
    botSettings,
    username,
    firstName,
    workspaceId,
  });

  return { identified: false, awaitingPin: true };
}
