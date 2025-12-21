import { conversationMessage, eq, file } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { getDownloadUrl } from "@qbs-autonaim/lib";
import { transcribeAudio } from "../../../services/media";
import { inngest } from "../../client";
import {
  formatMessageGroup,
  shouldProcessMessageGroup,
} from "./message-grouping";
import { MESSAGE_GROUPING_CONFIG } from "./message-grouping.config";

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
          .update(conversationMessage)
          .set({
            voiceTranscription: transcription,
          })
          .where(eq(conversationMessage.id, messageId));

        console.log("✅ Обновлена транскрипция в БД", {
          messageId,
          transcriptionLength: transcription.length,
        });
      });

      // Запускаем анализ интервью после проверки группировки
      await step.run("check-voice-grouping", async () => {
        const message = await db.query.conversationMessage.findFirst({
          where: eq(conversationMessage.id, messageId),
          with: {
            conversation: {
              with: {
                response: true,
              },
            },
          },
        });

        if (!message) {
          console.log("⏭️ Сообщение не найдено");
          return;
        }

        // Устанавливаем статус INTERVIEW при первом голосовом сообщении
        if (message.conversation?.responseId) {
          const candidateMessagesCount =
            await db.query.conversationMessage.findMany({
              where: (fields, { and, eq }) =>
                and(
                  eq(fields.conversationId, message.conversationId),
                  eq(fields.sender, "CANDIDATE"),
                ),
            });

          // Если это первое сообщение от кандидата
          if (candidateMessagesCount.length === 1) {
            const response = message.conversation.response;

            if (
              response &&
              (response.status === "NEW" || response.status === "EVALUATED")
            ) {
              const { vacancyResponse, RESPONSE_STATUS } = await import(
                "@qbs-autonaim/db/schema"
              );

              await db
                .update(vacancyResponse)
                .set({ status: RESPONSE_STATUS.INTERVIEW })
                .where(eq(vacancyResponse.id, response.id));

              console.log("✅ Статус изменен на INTERVIEW (первое голосовое)", {
                conversationId: message.conversationId,
                responseId: response.id,
                previousStatus: response.status,
              });
            }
          }
        }

        // Проверяем, является ли это последнее сообщение в группе
        const groupCheck = await shouldProcessMessageGroup(
          message.conversationId,
          message.externalMessageId || "",
        );

        if (!groupCheck.shouldProcess) {
          console.log("⏳ Голосовое не последнее в группе, ждём остальных", {
            conversationId: message.conversationId,
            messageId,
            reason: groupCheck.reason,
          });
          return; // Не отправляем событие - другое сообщение запустит анализ
        }

        // Это последнее сообщение в группе - все готово к обработке
        // groupCheck.messages уже содержит транскрипции для голосовых
        console.log("📦 Группа сообщений готова к обработке", {
          conversationId: message.conversationId,
          messagesCount: groupCheck.messages.length,
          reason: groupCheck.reason,
        });

        // Форматируем группу сообщений (текст + голосовые с транскрипциями)
        const combinedTranscription = formatMessageGroup(groupCheck.messages);

        console.log("🚀 Запуск анализа интервью", {
          conversationId: message.conversationId,
          messageId,
        });

        // Отправляем событие для анализа интервью
        await inngest.send({
          name: "telegram/interview.analyze",
          data: {
            conversationId: message.conversationId,
            transcription: combinedTranscription,
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
