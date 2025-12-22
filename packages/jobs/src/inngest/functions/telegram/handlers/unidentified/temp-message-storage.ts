import { db } from "@qbs-autonaim/db/client";
import {
  bufferedTempMessage,
  conversationMessage,
  tempConversationMessage,
} from "@qbs-autonaim/db/schema";
import { eq } from "drizzle-orm";
import {
  type BufferedTempMessageData,
  tempMessageBufferService,
} from "~/services/buffer/temp-message-buffer-service";

/**
 * Сохраняет временное сообщение для неидентифицированного пользователя
 */
export async function saveTempMessage(params: {
  tempConversationId: string;
  chatId: string;
  sender: "CANDIDATE" | "BOT";
  content: string;
  contentType?: "TEXT" | "VOICE";
  externalMessageId?: string;
}) {
  const {
    tempConversationId,
    chatId,
    sender,
    content,
    contentType = "TEXT",
    externalMessageId,
  } = params;

  try {
    await db.insert(tempConversationMessage).values({
      tempConversationId,
      chatId,
      sender,
      contentType,
      content,
      externalMessageId,
    });

    console.log("✅ Временное сообщение сохранено", {
      tempConversationId,
      sender,
      contentType,
    });
  } catch (error) {
    console.error("❌ Ошибка сохранения временного сообщения:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Переносит буферизованные сообщения в постоянное хранилище temp_conversation_messages
 */
export async function flushTempMessageBuffer(
  tempConversationId: string,
): Promise<void> {
  try {
    const bufferedMessages = await tempMessageBufferService.getMessages({
      tempConversationId,
    });

    if (bufferedMessages.length === 0) {
      console.log("Нет буферизованных сообщений для переноса", {
        tempConversationId,
      });
      return;
    }

    // Validate and extract chatId from tempConversationId
    if (!tempConversationId.startsWith("temp_")) {
      throw new Error(
        `Invalid tempConversationId format: expected "temp_" prefix, got "${tempConversationId}"`,
      );
    }

    const chatId = tempConversationId.slice(5); // Remove "temp_" prefix (5 characters)

    // Валидация числового chatId (Telegram ID)
    if (!chatId || !/^-?\d+$/.test(chatId)) {
      throw new Error(
        `Невалидный chatId извлечён из tempConversationId: "${chatId}"`,
      );
    }

    await db.transaction(async (tx) => {
      const messagesToInsert = bufferedMessages.map(
        (msg: BufferedTempMessageData) => ({
          tempConversationId,
          chatId,
          sender: msg.sender,
          contentType: msg.contentType,
          content: msg.content,
          externalMessageId: msg.externalMessageId,
        }),
      );

      await tx.insert(tempConversationMessage).values(messagesToInsert);

      // Clear buffer within the same transaction to ensure atomicity
      await tx
        .delete(bufferedTempMessage)
        .where(eq(bufferedTempMessage.tempConversationId, tempConversationId));
    });

    console.log(
      "✅ Буферизованные сообщения перенесены в temp_conversation_messages",
      {
        tempConversationId,
        count: bufferedMessages.length,
      },
    );
  } catch (error) {
    console.error("❌ Ошибка переноса буферизованных сообщений:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Переносит временные сообщения в основную таблицу после идентификации
 */
export async function migrateTempMessages(
  tempConversationId: string,
  realConversationId: string,
) {
  try {
    await db.transaction(async (tx) => {
      // Получаем все временные сообщения
      const tempMessages = await tx
        .select()
        .from(tempConversationMessage)
        .where(
          eq(tempConversationMessage.tempConversationId, tempConversationId),
        )
        .orderBy(tempConversationMessage.createdAt);

      if (tempMessages.length === 0) {
        console.log("Нет временных сообщений для переноса", {
          tempConversationId,
        });
        return;
      }

      // Переносим в основную таблицу одним batch insert
      const messagesToInsert = tempMessages.map((msg) => ({
        conversationId: realConversationId,
        sender: msg.sender as "CANDIDATE" | "BOT",
        contentType: msg.contentType as "TEXT" | "VOICE",
        content: msg.content,
        externalMessageId: msg.externalMessageId ?? undefined,
        channel: "TELEGRAM" as const,
      }));

      await tx.insert(conversationMessage).values(messagesToInsert);

      // Удаляем временные сообщения
      await tx
        .delete(tempConversationMessage)
        .where(
          eq(tempConversationMessage.tempConversationId, tempConversationId),
        );

      console.log("✅ Временные сообщения перенесены", {
        tempConversationId,
        realConversationId,
        count: tempMessages.length,
      });
    });
  } catch (error) {
    console.error("❌ Ошибка переноса временных сообщений:", {
      tempConversationId,
      realConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error; // Пробрасываем ошибку для retry handling
  }
}

/**
 * Получает историю временных сообщений
 */
export async function getTempMessageHistory(tempConversationId: string) {
  try {
    return await db
      .select()
      .from(tempConversationMessage)
      .where(eq(tempConversationMessage.tempConversationId, tempConversationId))
      .orderBy(tempConversationMessage.createdAt);
  } catch (error) {
    console.error("❌ Ошибка получения временных сообщений:", {
      tempConversationId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}
