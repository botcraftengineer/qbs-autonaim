import { Hono } from "hono";
import { z } from "zod";
import { botManager } from "../../bot-manager";
import { uploadFile } from "../../utils/file-upload";
import { handleError } from "../utils";

const files = new Hono();

const downloadFileSchema = z.object({
  workspaceId: z.string(),
  chatId: z.string(),
  messageId: z.number(),
});

files.post("/download", async (c) => {
  try {
    const body = await c.req.json();
    const result = downloadFileSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        { error: "Invalid request data", details: result.error.issues },
        400,
      );
    }

    const { workspaceId, chatId, messageId } = result.data;

    const client = botManager.getClient(workspaceId);
    if (!client) {
      return c.json(
        { error: `Bot not running for workspace ${workspaceId}` },
        404,
      );
    }

    // Получаем сообщение
    const messages = await client.getMessages(chatId, [messageId]);
    if (!messages || messages.length === 0) {
      return c.json({ error: "Message not found" }, 404);
    }

    const message = messages[0];
    if (!message || !message.media) {
      return c.json({ error: "Message has no media" }, 400);
    }

    if (message.media.type !== "voice" && message.media.type !== "audio") {
      return c.json(
        { error: "Only voice and audio messages are supported" },
        400,
      );
    }

    // Скачиваем файл
    const fileBuffer = await client.downloadAsBuffer(message.media);
    const fileName = `${message.media.type}_${messageId}.${message.media.type === "voice" ? "ogg" : "mp3"}`;
    const mimeType = message.media.mimeType || "audio/ogg";

    // Загружаем в S3 и создаем запись в БД
    const fileId = await uploadFile(
      Buffer.from(fileBuffer),
      fileName,
      mimeType,
    );

    const duration =
      "duration" in message.media ? (message.media.duration as number) : 0;

    return c.json({
      success: true,
      fileId,
      fileName,
      mimeType,
      duration,
    });
  } catch (error) {
    return c.json(
      { error: handleError(error, "Failed to download file") },
      500,
    );
  }
});

export default files;
