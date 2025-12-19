import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { createOrUpdateTempConversation, extractPinCode } from "../../utils";
import { handlePinIdentification } from "./identify-by-pin";
import { saveUnidentifiedMessage } from "./save-message";

/**
 * Обрабатывает текстовые сообщения от неидентифицированных пользователей
 *
 * ЛОГИКА ВАЛИДАЦИИ ПИНА:
 * 1. При каждом сообщении проверяем, есть ли в нем 4-значный код
 * 2. Если код найден:
 *    - Проверяем его валидность через identifyByPinCode
 *    - Если валидный → идентифицируем кандидата и переходим к PIN_RECEIVED (начало интервью)
 *    - Если невалидный → отправляем INVALID_PIN (просим попробовать еще раз)
 * 3. Если кода нет → отправляем AWAITING_PIN (просим прислать код)
 *
 * ВАЖНО: При каждой новой попытке ввода пина система заново проверяет его валидность,
 * поэтому после неудачной попытки кандидат может сразу прислать правильный код.
 */
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

  // Если в сообщении есть 4-значный код - проверяем его
  if (pinCode) {
    console.log("🔑 Обнаружен пин-код, проверяем валидность", {
      pinCode,
      chatId,
      tempConvId: tempConv.id,
    });

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
      console.log("✅ Пин-код валидный, кандидат идентифицирован", {
        pinCode,
        chatId,
      });
      return result;
    }

    // Пин-код невалидный - сохраняем сообщение и отправляем ошибку
    console.log("❌ Пин-код невалидный, отправляем INVALID_PIN", {
      pinCode,
      chatId,
    });

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
