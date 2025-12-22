import { env } from "@qbs-autonaim/config";
import { inngest } from "../../client";

/**
 * Обработчик typing/recording событий
 * Продлевает debounce без flush
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export const typingActivityFunction = inngest.createFunction(
  {
    id: "interview-typing-activity",
    name: "Interview Typing Activity Handler",
    debounce: {
      key: "event.data.userId + '-' + event.data.conversationId + '-' + event.data.interviewStep",
      period: `${env.INTERVIEW_TYPING_DEBOUNCE_TIMEOUT}s`,
    },
  },
  { event: "interview/typing.activity" },
  async ({ event, step }) => {
    const { userId, conversationId, interviewStep, activityType, timestamp } =
      event.data;

    console.log("⌨️ Typing activity detected", {
      userId,
      conversationId,
      interviewStep,
      activityType,
      timestamp,
    });

    // Логирование активности
    await step.run("log-activity", async () => {
      console.log("📝 Activity logged", {
        userId,
        conversationId,
        interviewStep,
        activityType,
        timestamp,
        debounceTimeout: env.INTERVIEW_TYPING_DEBOUNCE_TIMEOUT,
      });

      return {
        logged: true,
        activityType,
        timestamp,
      };
    });

    // Просто продлеваем ожидание
    // Реальный flush произойдет через message.buffered event
    return {
      activity: activityType,
      timestamp,
      debounceExtended: true,
    };
  },
);
