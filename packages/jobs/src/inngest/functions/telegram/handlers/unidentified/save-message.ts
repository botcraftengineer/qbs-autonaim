import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { findDuplicateMessage } from "../../utils";

export async function saveUnidentifiedMessage(params: {
  conversationId: string;
  content: string;
  messageId: string;
  contentType?: "TEXT" | "VOICE";
}) {
  const { conversationId, content, messageId, contentType = "TEXT" } = params;

  // Пропускаем сохранение для временных conversation ID
  // Сообщения будут сохранены после идентификации пользователя
  if (conversationId.startsWith("temp_")) {
    console.log("Skipping message save for temporary conversation:", {
      conversationId,
      messageId,
    });
    return;
  }

  try {
    const isDuplicate = await findDuplicateMessage(conversationId, messageId);

    if (!isDuplicate) {
      await db.insert(conversationMessage).values({
        conversationId,
        sender: "CANDIDATE",
        contentType,
        content,
        externalMessageId: messageId,
      });
    }
  } catch (error) {
    console.error("Failed to save unidentified message:", {
      conversationId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
