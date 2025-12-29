import {
  getInterviewStartData,
  identifyByPinCode,
  saveMessage,
} from "@qbs-autonaim/lib";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { migrateTempMessages } from "./temp-message-storage";

/**
 * Обрабатывает попытку идентификации кандидата по пин-коду
 *
 * ПРОЦЕСС:
 * 1. Проверяем пин-код через identifyByPinCode (поиск в БД по telegramPinCode)
 * 2. Если пин валидный:
 *    - Переносим временные сообщения в основную conversation
 *    - Сохраняем сообщение с пином
 *    - Отправляем приветствие и начинаем интервью (PIN_RECEIVED)
 * 3. Если пин невалидный:
 *    - Возвращаем { identified: false, invalidPin: true }
 *    - Вызывающая функция отправит INVALID_PIN и попросит попробовать еще раз
 */
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

  const identification = await identifyByPinCode(
    pinCode,
    chatId,
    workspaceId,
    username,
    firstName,
  );

  // Проверяем результат идентификации
  if (
    identification.success &&
    identification.conversationId &&
    identification.responseId
  ) {
    console.log("✅ Пин-код валидный, идентификация успешна", {
      conversationId: identification.conversationId,
      responseId: identification.responseId,
      pinCode,
    });

    // Переносим временные сообщения в основную таблицу
    await migrateTempMessages(tempConvId, identification.conversationId);

    // Сохраняем текущее сообщение с пин-кодом
    await saveMessage(
      identification.conversationId,
      "CANDIDATE",
      trimmedText,
      "TEXT",
      messageId,
      "TELEGRAM",
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

  // Пин-код невалидный
  console.log("❌ Пин-код невалидный", {
    pinCode,
    chatId,
    error: identification.error,
  });

  return { identified: false, invalidPin: true };
}
