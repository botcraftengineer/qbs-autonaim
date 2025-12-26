import { db } from "@qbs-autonaim/db/client";
import { conversationMessage } from "@qbs-autonaim/db/schema";
import { removeNullBytes } from "@qbs-autonaim/lib";
import { tempMessageBufferService } from "~/services/buffer/temp-message-buffer-service";
import { findDuplicateMessage } from "../../utils";

export async function saveUnidentifiedMessage(params: {
  conversationId: string;
  content: string;
  messageId: string;
  contentType?: "TEXT" | "VOICE";
}) {
  const { conversationId, content, messageId, contentType = "TEXT" } = params;

  if (conversationId.startsWith("temp_")) {
    const chatId = conversationId.replace("temp_", "");

    try {
      await tempMessageBufferService.addMessage({
        tempConversationId: conversationId,
        chatId,
        message: {
          id: messageId,
          content,
          contentType,
          sender: "CANDIDATE",
          timestamp: new Date(),
          externalMessageId: messageId,
        },
      });
    } catch (error) {
      console.error("Failed to save temporary message:", {
        conversationId,
        chatId,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  try {
    const isDuplicate = await findDuplicateMessage(conversationId, messageId);

    if (!isDuplicate) {
      await db.insert(conversationMessage).values({
        conversationId,
        sender: "CANDIDATE",
        contentType,
        content: removeNullBytes(content),
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
