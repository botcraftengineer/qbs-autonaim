import { env } from "@qbs-autonaim/config";
import { messageBufferService } from "../../../services/buffer";
import { inngest } from "../../client";

/**
 * Функция debounce для буфера сообщений
 * Запускается при каждом новом сообщении
 * Ждет N секунд без активности перед flush
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */
export const bufferDebounceFunction = inngest.createFunction(
  {
    id: "interview-buffer-debounce",
    name: "Interview Buffer Debounce",
    debounce: {
      key: "event.data.userId + '-' + event.data.conversationId + '-' + event.data.interviewStep",
      period: `${env.INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT}s`,
    },
  },
  { event: "interview/message.buffered" },
  async ({ event, step }) => {
    const { userId, conversationId, interviewStep, messageId, timestamp } =
      event.data;

    console.log("⏱️ Запущен debounce буфера", {
      userId,
      conversationId,
      interviewStep,
      messageId,
      timestamp,
    });

    // Проверка существования буфера
    const hasBuffer = await step.run("check-buffer", async () => {
      const exists = await messageBufferService.hasBuffer({
        userId,
        conversationId,
        interviewStep,
      });

      console.log("🔍 Проверка существования буфера", {
        userId,
        conversationId,
        interviewStep,
        exists,
      });

      return exists;
    });

    if (!hasBuffer) {
      console.log("⏭️ Буфер уже обработан, пропускаем", {
        userId,
        conversationId,
        interviewStep,
      });
      return { skipped: true, reason: "Буфер уже обработан" };
    }

    // Генерация flushId для идемпотентности
    const flushId = `${userId}-${conversationId}-${interviewStep}-${Date.now()}`;

    // Отправка события flush
    await step.sendEvent("trigger-flush", {
      name: "interview/buffer.flush",
      data: {
        userId,
        conversationId,
        interviewStep,
        flushId,
        messageCount: 0, // будет заполнено в flush функции
      },
    });

    console.log("✅ Событие flush отправлено", {
      userId,
      conversationId,
      interviewStep,
      flushId,
    });

    return {
      success: true,
      flushId,
      triggeredAt: Date.now(),
    };
  },
);
