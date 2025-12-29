import { screenResponse, unwrap } from "../../../services/response";
import { inngest } from "../../client";

/**
 * Inngest function for AI analysis of freelance responses
 * Triggers when a freelance response is imported
 * Reuses existing screenResume logic adapted for response text
 */
export const analyzeFreelanceResponseFunction = inngest.createFunction(
  {
    id: "freelance-response-analyze",
    name: "Analyze Freelance Response",
    retries: 3,
    // Экспоненциальная задержка для повторов: 2s, 4s, 8s
    onFailure: async ({ error, event }) => {
      const responseId = (event.data as unknown as { responseId: string })
        .responseId;

      console.error("❌ Все попытки AI-анализа исчерпаны", {
        responseId,
        error: error.message,
      });

      // Отправляем уведомление работодателю о неудаче анализа
      await inngest.send({
        name: "freelance/notification.send",
        data: {
          responseId,
          notificationType: "ANALYSIS_FAILED" as const,
          error: error.message,
        },
      });
    },
  },
  { event: "freelance/response.analyze" },
  async ({ event, step, attempt }) => {
    const { responseId } = event.data;

    const result = await step.run("analyze-freelance-response", async () => {
      console.log("🎯 AI-анализ отклика фрилансера", {
        responseId,
        attempt,
      });

      // Экспоненциальная задержка перед повтором
      if (attempt > 0) {
        const delayMs = 2 ** attempt * 1000; // 2s, 4s, 8s
        console.log(
          `⏳ Задержка перед повтором: ${delayMs}ms (попытка ${attempt + 1}/3)`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      try {
        const resultWrapper = await screenResponse(responseId);
        const result = unwrap(resultWrapper);

        console.log("✅ Анализ завершен", {
          responseId,
          score: result.score,
          detailedScore: result.detailedScore,
          attempt: attempt + 1,
        });

        return {
          success: true,
          responseId,
          result,
        };
      } catch (error) {
        console.error("❌ Ошибка анализа отклика фрилансера", {
          responseId,
          error,
          attempt: attempt + 1,
        });
        throw error;
      }
    });

    // Trigger invitation generation after successful analysis
    await step.sendEvent("trigger-invitation-generation", {
      name: "freelance/invitation.generate",
      data: {
        responseId,
      },
    });

    return result;
  },
);
