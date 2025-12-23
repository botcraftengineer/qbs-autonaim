import { getAIModel } from "@qbs-autonaim/lib/ai";
import { AgentFactory } from "@qbs-autonaim/prompts";
import { generateAndSendBotResponse } from "../../bot-response";
import type { BotSettings } from "../../types";
import { createOrUpdateTempConversation, extractPinCode } from "../../utils";
import { handlePinIdentification } from "./identify-by-pin";
import { saveUnidentifiedMessage } from "./save-message";

/**
 * Обрабатывает текстовые сообщения от неидентифицированных пользователей
 *
 * ЛОГИКА ВАЛИДАЦИИ ПИНА (улучшенная с AI):
 * 1. Используем EnhancedContextAnalyzerAgent для анализа сообщения
 * 2. Агент определяет тип сообщения (PIN_CODE, GREETING, QUESTION и т.д.)
 * 3. Если обнаружен PIN_CODE:
 *    - Извлекаем пин-код из extractedData
 *    - Проверяем его валидность через identifyByPinCode
 *    - Если валидный → идентифицируем кандидата и переходим к PIN_RECEIVED (начало интервью)
 *    - Если невалидный → отправляем INVALID_PIN (просим попробовать еще раз)
 * 4. Если GREETING → отправляем приветствие с просьбой прислать пин-код
 * 5. Если другой тип → отправляем AWAITING_PIN (просим прислать код)
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

  // Создаем временную conversation
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

  // Подсчитываем количество неудачных попыток PIN из истории
  const { getConversationHistory } = await import("../../utils");
  const history = await getConversationHistory(tempConv.id);
  const failedPinAttempts = history.filter(
    (msg) =>
      msg.sender === "BOT" &&
      msg.content.toLowerCase().includes("код не подошел"),
  ).length;

  let pinCode: string | null = null;

  // Используем AI-агент для анализа сообщения
  try {
    const model = getAIModel();
    const factory = new AgentFactory({ model });
    const contextAnalyzer = factory.createContextAnalyzer();

    const analysisResult = await contextAnalyzer.execute(
      {
        message: trimmedText,
        previousMessages: [],
      },
      {
        conversationHistory: [],
      },
    );

    if (analysisResult.success && analysisResult.data) {
      const { messageType, extractedData } = analysisResult.data;

      console.log("🤖 AI анализ сообщения", {
        messageType,
        extractedData,
        chatId,
      });

      // Обработка пин-кода
      if (messageType === "PIN_CODE" && extractedData?.pinCode) {
        pinCode = extractedData.pinCode;

        console.log("🔑 AI обнаружил пин-код, проверяем валидность", {
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

        // Пин-код невалидный
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
          failedPinAttempts: failedPinAttempts + 1,
        });

        return { identified: false, invalidPin: true };
      }

      // Обработка приветствия
      if (messageType === "GREETING") {
        console.log(
          "👋 Обнаружено приветствие, отправляем приветствие с просьбой пин-кода",
          {
            chatId,
          },
        );

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

        return { identified: false, awaitingPin: true, greeting: true };
      }
    }
  } catch (error) {
    console.error("❌ Ошибка AI анализа, используем fallback", {
      error,
      chatId,
    });
  }

  // Fallback: используем старый метод извлечения пин-кода (если AI не нашел)
  if (!pinCode) {
    pinCode = extractPinCode(trimmedText);
  }

  // Если в сообщении есть 4-значный код - проверяем его
  if (pinCode) {
    console.log("🔑 Обнаружен пин-код (fallback), проверяем валидность", {
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
      failedPinAttempts: failedPinAttempts + 1,
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
