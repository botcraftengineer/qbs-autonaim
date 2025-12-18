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

  try {
    const isDuplicate = await findDuplicateMessage(conversationId, messageId);

    if (!isDuplicate) {
      await db.insert(conversationMessage).values({
        conversationId,
        sender: "CANDIDATE",
        contentType,
        content,
        conversationMessageId: messageId,
      });
    }
  } catch (error) {
    console.error("Failed to save unidentified message:", {
      conversationId,
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    // Не бросаем ошибку, чтобы продолжить выполнение
  }
}
