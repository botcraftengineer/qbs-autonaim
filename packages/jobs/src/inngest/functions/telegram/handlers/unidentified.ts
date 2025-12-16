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

  let tempConv;
  try {
    tempConv = await createOrUpdateTempConversation(
      chatId,
      username,
      firstName,
    );
  } catch (error) {
    console.error("Failed to create/update temp conversation:", {
      chatId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (pinCode) {
    let identification;
    try {
      identification = await identifyByPinCode(
        pinCode,
        chatId,
        workspaceId,
        username,
        firstName,
      );
    } catch (error) {
      console.error("Failed to identify by pin code:", {
        chatId,
        messageId,
        pinCode,
        error: error instanceof Error ? error.message : String(error),
      });

      // Для неидентифицированного пользователя продолжаем с fallback
      if (tempConv) {
        try {
          const isDuplicate = await findDuplicateMessage(
            tempConv.id,
            messageId,
          );
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
        } catch (fallbackError) {
          console.error("Failed to send fallback response:", {
            chatId,
            messageId,
            error:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          });
        }
      }

      return { identified: false, error: true };
    }

    if (
      identification.success &&
      identification.conversationId &&
      identification.responseId
    ) {
      try {
        await saveMessage(
          identification.conversationId,
          "CANDIDATE",
          trimmedText,
          "TEXT",
          messageId,
        );
      } catch (error) {
        console.error("Failed to save message:", {
          conversationId: identification.conversationId,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      let interviewData;
      try {
        interviewData = await getInterviewStartData(identification.responseId);
      } catch (error) {
        console.error("Failed to get interview start data:", {
          conversationId: identification.conversationId,
          responseId: identification.responseId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      try {
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
      } catch (error) {
        console.error("Failed to generate and send bot response:", {
          conversationId: identification.conversationId,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }

      try {
        await inngest.send({
          name: "telegram/interview.analyze",
          data: {
            conversationId: identification.conversationId,
            transcription: trimmedText,
          },
        });
      } catch (error) {
        console.error("Failed to send inngest event:", {
          conversationId: identification.conversationId,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Не бросаем ошибку, так как это не критично для основного потока
      }

      return { identified: true };
    }

    // Неверный пин-код
    if (tempConv) {
      try {
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
      } catch (error) {
        console.error("Failed to check duplicate or insert message:", {
          conversationId: tempConv.id,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
        // Продолжаем выполнение, чтобы отправить ответ пользователю
      }

      try {
        await generateAndSendBotResponse({
          conversationId: tempConv.id,
          messageText: trimmedText,
          stage: "INVALID_PIN",
          botSettings,
          username,
          firstName,
          workspaceId,
        });
      } catch (error) {
        console.error("Failed to send invalid pin response:", {
          conversationId: tempConv.id,
          messageId,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }

    return { identified: false, invalidPin: true };
  }

  // Нет пин-кода
  if (tempConv) {
    try {
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
    } catch (error) {
      console.error("Failed to check duplicate or insert message (no pin):", {
        conversationId: tempConv.id,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Продолжаем выполнение, чтобы отправить ответ пользователю
    }

    try {
      await generateAndSendBotResponse({
        conversationId: tempConv.id,
        messageText: trimmedText,
        stage: "AWAITING_PIN",
        botSettings,
        username,
        firstName,
        workspaceId,
      });
    } catch (error) {
      console.error("Failed to send awaiting pin response:", {
        conversationId: tempConv.id,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
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

  let tempConv: typeof telegramConversation.$inferSelect | undefined;
  try {
    const result = await db
      .insert(telegramConversation)
      .values({
        chatId,
        candidateName: firstName,
        username,
        status: "ACTIVE",
        metadata: JSON.stringify({
          identifiedBy: "none",
          awaitingPin: true,
        }),
      })
      .onConflictDoNothing()
      .returning();

    tempConv = result[0];
  } catch (error) {
    console.error("Failed to create temp conversation for media:", {
      chatId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  if (tempConv) {
    try {
      await db.insert(telegramMessage).values({
        conversationId: tempConv.id,
        sender: "CANDIDATE",
        contentType: "VOICE",
        content: "Голосовое сообщение (кандидат не идентифицирован)",
        telegramMessageId: messageId,
      });
    } catch (error) {
      console.error("Failed to insert media message:", {
        conversationId: tempConv.id,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      // Продолжаем выполнение, чтобы отправить ответ пользователю
    }

    try {
      await generateAndSendBotResponse({
        conversationId: tempConv.id,
        messageText: "[Голосовое сообщение]",
        stage: "AWAITING_PIN",
        botSettings,
        username,
        firstName,
        workspaceId,
      });
    } catch (error) {
      console.error("Failed to send awaiting pin response for media:", {
        conversationId: tempConv.id,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  return { processed: true, identified: false };
}
