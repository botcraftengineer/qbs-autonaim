import { eq, file, interviewMessage } from "@qbs-autonaim/db";
import { db } from "@qbs-autonaim/db/client";
import { RESPONSE_STATUS, response } from "@qbs-autonaim/db/schema";
import { getDownloadUrl } from "@qbs-autonaim/lib";
import { transcribeAudio } from "../../../services/media";
import { inngest } from "../../client";
import {
  formatMessageGroup,
  shouldProcessMessageGroup,
} from "./message-grouping";

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
          .update(interviewMessage)
          .set({
            voiceTranscription: transcription,
          })
          .where(eq(interviewMessage.id, messageId));

        console.log("✅ Обновлена транскрипция в БД", {
          messageId,
          transcriptionLength: transcription.length,
        });
      });

      // Попытка буферизации после транскрипции
      await step.run("try-buffer-voice-message", async () => {
        const message = await db.query.interviewMessage.findFirst({
          where: eq(interviewMessage.id, messageId),
        });

        if (!message) {
          console.log("⏭️ Сообщение не найдено");
          return;
        }

        // Получаем interviewSession
        const session = await db.query.interviewSession.findFirst({
          where: (fields, { eq }) => eq(fields.id, message.sessionId),
        });

        if (!session) {
          console.log("⏭️ InterviewSession не найден");
          return;
        }

        // Пытаемся буферизовать голосовое сообщение с транскрипцией
        try {
          const { env } = await import("@qbs-autonaim/config");
          const { messageBufferService } = await import(
            "../../../services/buffer"
          );
          const { getCurrentInterviewStep } = await import(
            "@qbs-autonaim/tg-client"
          );
          const { getInterviewSessionMetadata } = await import(
            "@qbs-autonaim/shared"
          );

          const bufferEnabled = env.INTERVIEW_BUFFER_ENABLED ?? false;

          if (!bufferEnabled) {
            console.log("ℹ️ Буферизация отключена для голосовых");
            return;
          }

          const interviewSessionId = message.sessionId;
          const interviewStep =
            await getCurrentInterviewStep(interviewSessionId);

          // Получаем контекст вопроса
          let questionContext: string | undefined;
          try {
            const metadata =
              await getInterviewSessionMetadata(interviewSessionId);
            questionContext = metadata.lastQuestionAsked;
          } catch (error) {
            console.error("❌ Ошибка получения questionContext:", error);
          }

          // Добавляем в буфер
          await messageBufferService.addMessage({
            userId: interviewSessionId,
            chatSessionId: interviewSessionId,
            interviewStep,
            message: {
              id: messageId,
              content: transcription,
              contentType: "VOICE",
              timestamp: Date.now(),
              questionContext,
            },
          });

          console.log("✅ Голосовое сообщение добавлено в буфер", {
            interviewSessionId,
            interviewStep,
            messageId,
            transcriptionLength: transcription.length,
          });

          // Отправляем событие в Inngest для debounce
          if (env.INNGEST_EVENT_KEY) {
            await fetch(
              `${env.INNGEST_EVENT_API_BASE_URL}/e/${env.INNGEST_EVENT_KEY}`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: "interview/message.buffered",
                  data: {
                    userId: interviewSessionId,
                    chatSessionId: interviewSessionId,
                    interviewStep,
                    messageId,
                    timestamp: Date.now(),
                  },
                }),
              },
            );

            console.log(
              "✅ Событие interview/message.buffered отправлено для голосового",
              {
                interviewSessionId,
                interviewStep,
                messageId,
              },
            );

            // Если буферизация успешна, выходим - не запускаем стандартную обработку
            return;
          }
        } catch (error) {
          console.error("❌ Ошибка буферизации голосового сообщения:", error);
          // Продолжаем стандартную обработку при ошибке
        }
      });

      // Запускаем анализ интервью после проверки группировки (если буферизация не сработала)
      await step.run("check-voice-grouping", async () => {
        const message = await db.query.interviewMessage.findFirst({
          where: eq(interviewMessage.id, messageId),
        });

        if (!message) {
          console.log("⏭️ Сообщение не найдено");
          return;
        }

        // Получаем interviewSession и response
        const session = await db.query.interviewSession.findFirst({
          where: (fields, { eq }) => eq(fields.id, message.sessionId),
        });

        if (!session) {
          console.log("⏭️ InterviewSession не найден");
          return;
        }

        // Устанавливаем статус INTERVIEW при первом голосовом сообщении
        if (
          session.entityType === "vacancy_response" &&
          session.vacancyResponseId
        ) {
          const candidateMessagesCount =
            await db.query.interviewMessage.findMany({
              where: (fields, { and, eq }) =>
                and(
                  eq(fields.sessionId, message.sessionId),
                  eq(fields.role, "user"),
                ),
            });

          // Если это первое сообщение от кандидата
          if (candidateMessagesCount.length === 1) {
            const response = await db.query.vacancyResponse.findFirst({
              where: eq(vacancyResponse.id, session.vacancyResponseId),
            });

            if (
              response &&
              (response.status === "NEW" || response.status === "EVALUATED")
            ) {
              await db
                .update(vacancyResponse)
                .set({ status: RESPONSE_STATUS.INTERVIEW })
                .where(eq(vacancyResponse.id, response.id));

              console.log("✅ Статус изменен на INTERVIEW (первое голосовое)", {
                interviewSessionId: message.sessionId,
                responseId: response.id,
                previousStatus: response.status,
              });
            }
          }
        }

        // Проверяем, является ли это последнее сообщение в группе
        const groupCheck = await shouldProcessMessageGroup(
          message.sessionId,
          message.externalId || "",
        );

        if (!groupCheck.shouldProcess) {
          console.log("⏳ Голосовое не последнее в группе, ждём остальных", {
            interviewSessionId: message.sessionId,
            messageId,
            reason: groupCheck.reason,
          });
          return; // Не отправляем событие - другое сообщение запустит анализ
        }

        // Это последнее сообщение в группе - все готово к обработке
        // groupCheck.messages уже содержит транскрипции для голосовых
        console.log("📦 Группа сообщений готова к обработке", {
          interviewSessionId: message.sessionId,
          messagesCount: groupCheck.messages.length,
          reason: groupCheck.reason,
        });

        // Форматируем группу сообщений (текст + голосовые с транскрипциями)
        const combinedTranscription = formatMessageGroup(groupCheck.messages);

        console.log("🚀 Запуск анализа интервью", {
          interviewSessionId: message.sessionId,
          messageId,
        });

        // Отправляем событие для анализа интервью
        await inngest.send({
          name: "telegram/interview.analyze",
          data: {
            chatSessionId: message.sessionId,
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
