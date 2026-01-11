import { randomUUID } from "node:crypto";
import { env } from "@qbs-autonaim/config";
import { messageBufferService } from "../../../services/buffer";
import { inngest } from "../../client";

/**
 * Функция debounce для буфера сообщений
 * Запускается при каждом новом сообщении
 * Ждет N секунд без активности перед flush
 */
export const bufferDebounceFunction = inngest.createFunction(
  {
    id: "interview-buffer-debounce",
    name: "Interview Buffer Debounce",
    debounce: {
      key: "event.data.userId + '-' + event.data.chatSessionId + '-' + event.data.interviewStep",
      period: `${env.INTERVIEW_BUFFER_DEBOUNCE_TIMEOUT}s`,
    },
  },
  { event: "interview/message.buffered" },
  async ({ event, step }) => {
    const { userId, chatSessionId, interviewStep } = event.data;

    if (!chatSessionId) {
      return {
        skipped: true,
        reason: "No chatSessionId provided",
      };
    }

    // Проверка существования буфера
    const hasBuffer = await step.run("check-buffer", async () => {
      const exists = await messageBufferService.hasBuffer({
        userId,
        chatSessionId,
        interviewStep,
      });

      return exists;
    });

    if (!hasBuffer) {
      return { skipped: true, reason: "Буфер уже обработан" };
    }

    // Генерация flushId для идемпотентности (collision-resistant UUID)
    const flushId = randomUUID();

    // Отправка события flush
    await step.sendEvent("trigger-flush", {
      name: "interview/buffer.flush",
      data: {
        userId,
        chatSessionId,
        interviewStep,
        flushId,
        messageCount: 0, // будет заполнено в flush функции
      },
    });

    return {
      success: true,
      flushId,
      triggeredAt: Date.now(),
    };
  },
);
