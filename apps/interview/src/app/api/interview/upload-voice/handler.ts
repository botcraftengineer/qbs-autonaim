/**
 * Публичный endpoint для загрузки голосовых сообщений в интервью
 * Доступен без авторизации, но защищён проверкой sessionId
 * Только для WEB интервью (lastChannel = 'web')
 */
import { db, eq } from "@qbs-autonaim/db";
import { file, interviewMessage } from "@qbs-autonaim/db/schema";
import { inngest } from "@qbs-autonaim/jobs/client";
import { uploadFile } from "@qbs-autonaim/lib/s3";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  conversationId: z.string().uuid(),
  audioFile: z.string(), // base64
  fileName: z.string(),
  mimeType: z.string(),
  duration: z.number().optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { conversationId, audioFile, fileName, mimeType, duration } =
      requestSchema.parse(json);

    // Проверяем что conversation существует и это WEB интервью
    const conv = await db.query.conversation.findFirst({
      where: (c, { and }) => and(eq(c.id, conversationId), eq(c.source, "WEB")),
    });

    if (!conv) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    if (conv.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Interview is not active" },
        { status: 403 },
      );
    }

    // Декодируем base64
    const base64Data = audioFile.replace(/^data:audio\/\w+;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, "base64");

    // Проверяем размер (макс 25MB)
    if (fileBuffer.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB" },
        { status: 400 },
      );
    }

    // Загружаем в S3
    const key = await uploadFile(fileBuffer, fileName, mimeType, "voice");

    // Создаем запись файла в БД
    const [fileRecord] = await db
      .insert(file)
      .values({
        provider: "S3",
        key,
        fileName,
        mimeType,
        fileSize: fileBuffer.length.toString(),
      })
      .returning();

    if (!fileRecord) {
      throw new Error("Failed to create file record");
    }

    // Форматируем длительность
    const voiceDuration = duration
      ? `${Math.floor(duration / 60)}:${String(Math.floor(duration % 60)).padStart(2, "0")}`
      : undefined;

    // Создаем сообщение в БД
    const [message] = await db
      .insert(conversationMessage)
      .values({
        conversationId,
        sender: "CANDIDATE",
        contentType: "VOICE",
        channel: "WEB",
        content: "", // Будет заполнено после транскрибации
        fileId: fileRecord.id,
        voiceDuration,
      })
      .returning();

    if (!message) {
      throw new Error("Failed to create message");
    }

    // Отправляем событие на транскрибацию
    try {
      await inngest.send({
        name: "telegram/voice.transcribe",
        data: {
          messageId: message.id,
          fileId: fileRecord.id,
        },
      });
    } catch (error) {
      console.error("Failed to send transcription event:", error);
      // Не падаем, если Inngest недоступен
    }

    return NextResponse.json({
      success: true,
      messageId: message.id,
      fileId: fileRecord.id,
    });
  } catch (error) {
    console.error("[Interview Upload Voice] Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
