import { logger, task } from "@trigger.dev/sdk";
import { screenResponse } from "../services/response-screening-service";

export const screenResponseTask = task({
  id: "screen-response",
  maxDuration: 300,
  run: async (payload: { responseId: string }) => {
    logger.log("🎯 Скрининг отклика через AI", {
      responseId: payload.responseId,
    });

    try {
      const result = await screenResponse(payload.responseId);

      logger.log("✅ Скрининг завершен", {
        responseId: payload.responseId,
        score: result.score,
        questionsCount: result.questions?.length || 0,
      });

      return {
        success: true,
        responseId: payload.responseId,
        result,
      };
    } catch (error) {
      logger.error("❌ Ошибка скрининга отклика", {
        responseId: payload.responseId,
        error,
      });
      throw error;
    }
  },
});
