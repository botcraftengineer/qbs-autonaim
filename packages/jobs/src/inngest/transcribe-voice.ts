import { db, eq, file, telegramMessage } from "@selectio/db";
import { transcribeAudio } from "../services/transcription-service";
import { inngest } from "./client";

/**
 * Inngest функция для транскрибации голосовых сообщений
 */
export const transcribeVoiceFunction = inngest.createFunction(
  {
    id: "transcribe-voice",
    name: "Transcribe Voice Message",
    retries: 3,
  },
  { event: "telegram/voice.transcribe" },
  async ({ event, step }) => {
    const { messageId, fileId } = event.data;

    const transcription = await step.run("transcribe-audio", async () => {
      console.log("🎤 Транскрибация голосового сообщения", {
        messageId,
        fileId,
      });

      try {
        // Получаем файл из базы данных
        const [fileRecord] = await db
          .select()
          .from(file)
          .where(eq(file.id, fileId))
          .limit(1);

        if (!fileRecord) {
          throw new Error(`Файл не найден: ${fileId}`);
        }

        // Получаем URL для скачивания файла
        const { getDownloadUrl } = await import("@selectio/lib");
        const fileUrl = await getDownloadUrl(fileRecord.key);

        // Скачиваем файл
        const response = await fetch(fileUrl);
        const fileBuffer = Buffer.from(await response.arrayBuffer());

        // Транскрибируем аудио
        const transcriptionText = await transcribeAudio(fileBuffer);

        console.log("✅ Транскрипция завершена", {
          messageId,
          fileId,
          transcriptionLength: transcriptionText?.length || 0,
        });

        return transcriptionText;
      } catch (error) {
        console.error("❌ Ошибка транскрибации", {
          messageId,
          fileId,
          error,
        });
        throw error;
      }
    });

    // Обновляем запись сообщения с транскрипцией
    await step.run("update-message-transcription", async () => {
      await db
        .update(telegramMessage)
        .set({
          voiceTranscription: transcription,
        })
        .where(eq(telegramMessage.id, messageId));

      console.log("✅ Обновлена транскрипция в БД", {
        messageId,
        transcriptionLength: transcription?.length || 0,
      });
    });

    return {
      success: true,
      messageId,
      fileId,
      transcription,
    };
  },
);
