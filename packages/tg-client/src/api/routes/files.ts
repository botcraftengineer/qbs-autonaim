import { fileTypeFromBuffer } from "file-type";
import { Hono } from "hono";
import mime from "mime-types";
import { botManager } from "../../bot-manager";
import { uploadFile } from "../../utils/file-upload";
import {
  getFloodWaitSeconds,
  isFloodWaitError,
  sleep,
} from "../../utils/flood-wait";
import { downloadFileSchema } from "../schemas";
import { handleError } from "../utils";

const files = new Hono();

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

    // Получаем сообщение с обработкой FLOOD_WAIT
    let messages: Awaited<ReturnType<typeof client.getMessages>>;
    try {
      messages = await client.getMessages(chatId, [messageId]);
    } catch (error) {
      if (isFloodWaitError(error)) {
        const waitSeconds = getFloodWaitSeconds(error);
        console.warn(
          `⏳ FLOOD_WAIT при получении сообщения: ожидание ${waitSeconds} секунд...`,
        );
        await sleep(waitSeconds * 1000);
        // Повторная попытка
        messages = await client.getMessages(chatId, [messageId]);
      } else {
        throw error;
      }
    }

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

    // Скачиваем файл с обработкой FLOOD_WAIT
    let fileBuffer: Uint8Array;
    try {
      fileBuffer = await client.downloadAsBuffer(message.media);
    } catch (error) {
      if (isFloodWaitError(error)) {
        const waitSeconds = getFloodWaitSeconds(error);
        console.warn(
          `⏳ FLOOD_WAIT при скачивании файла: ожидание ${waitSeconds} секунд...`,
        );
        await sleep(waitSeconds * 1000);
        // Повторная попытка
        fileBuffer = await client.downloadAsBuffer(message.media);
      } else {
        throw error;
      }
    }

    // Определяем MIME type и расширение
    let mimeType = message.media.mimeType || null;
    let extension: string | null = null;

    // Если есть mimeType в сообщении, получаем расширение из него
    if (mimeType) {
      extension = mime.extension(mimeType) || null;
    }

    // Если mimeType отсутствует или расширение не определено, детектим из содержимого файла
    if (!mimeType || !extension) {
      const detectedType = await fileTypeFromBuffer(Buffer.from(fileBuffer));
      if (detectedType) {
        mimeType = detectedType.mime;
        extension = detectedType.ext;
      }
    }

    // Fallback если ничего не определилось
    if (!mimeType) {
      mimeType = "application/octet-stream";
    }
    if (!extension) {
      extension = "bin";
    }

    const fileName = `${message.media.type}_${messageId}.${extension}`;

    // Загружаем в S3 и создаем запись в БД
    const fileId = await uploadFile(
      Buffer.from(fileBuffer),
      fileName,
      mimeType,
    );

    const duration =
      "duration" in message.media && typeof message.media.duration === "number"
        ? message.media.duration
        : 0;

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
