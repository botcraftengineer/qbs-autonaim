import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { findDuplicateMessage } from "../../utils";
import { saveTempMessage } from "./temp-message-storage";

export async function saveUnidentifiedMessage(params: {
  conversationId: string;
  content: string;
  messageId: string;
  contentType?: "TEXT" | "VOICE";
}) {
  const { conversationId, content, messageId, contentType = "TEXT" } = params;

  if (conversationId.startsWith("temp_")) {
    // Сохраняем во временное хранилище
    const chatId = conversationId.replace("temp_", "");
    await saveTempMessage({
      tempConversationId: conversationId,
      chatId,
      sender: "CANDIDATE",
      content,
      contentType,
      externalMessageId: messageId,
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
