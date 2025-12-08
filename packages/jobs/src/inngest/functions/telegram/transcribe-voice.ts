import { db, eq, file, telegramMessage } from "@qbs-autonaim/db";
import { transcribeAudio } from "../../../services/media";
import { inngest } from "../../client";

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
        const { getDownloadUrl } = await import("@qbs-autonaim/lib");
        const fileUrl = await getDownloadUrl(fileRecord.key);

        // Скачиваем файл
        const response = await fetch(fileUrl);
        const fileBuffer = Buffer.from(await response.arrayBuffer());

        // Транскрибируем аудио
        const transcriptionResult = await transcribeAudio(fileBuffer);

        if (!transcriptionResult.success) {
          console.error("❌ Ошибка транскрибации", {
            messageId,
            fileId,
            error: transcriptionResult.error,
          });
          throw new Error(transcriptionResult.error);
        }

        const transcriptionText = transcriptionResult.data;

        if (transcriptionText) {
          console.log("✅ Транскрипция завершена", {
            messageId,
            fileId,
            transcriptionLength: transcriptionText.length,
          });
        } else {
          console.log("⏭️ Транскрипция пропущена (OPENAI_API_KEY не заполнен)", {
            messageId,
            fileId,
          });
        }

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

    // Обновляем запись сообщения с транскрипцией (только если она есть)
    if (transcription) {
      await step.run("update-message-transcription", async () => {
        await db
          .update(telegramMessage)
          .set({
            voiceTranscription: transcription,
          })
          .where(eq(telegramMessage.id, messageId));

        console.log("✅ Обновлена транскрипция в БД", {
          messageId,
          transcriptionLength: transcription.length,
        });
      });

      // Запускаем анализ интервью в отдельной задаче
      await step.run("trigger-interview-analysis", async () => {
        const [message] = await db
          .select()
          .from(telegramMessage)
          .where(eq(telegramMessage.id, messageId))
          .limit(1);

        if (!message) {
          console.log("⏭️ Сообщение не найдено");
          return;
        }

        console.log("🚀 Запуск анализа интервью", {
          conversationId: message.conversationId,
          messageId,
        });

        // Отправляем событие для анализа интервью
        await inngest.send({
          name: "telegram/interview.analyze",
          data: {
            conversationId: message.conversationId,
            transcription,
          },
        });

        console.log("✅ Событие анализа интервью отправлено");
      });
    }

    return {
      success: true,
      messageId,
      fileId,
      transcription,
    };
  },
);
