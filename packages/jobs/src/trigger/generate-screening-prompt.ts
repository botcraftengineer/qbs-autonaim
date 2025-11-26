import { logger, task } from "@trigger.dev/sdk";
import { generateScreeningPrompt } from "../services/screening-prompt-service";

export const generateScreeningPromptTask = task({
  id: "generate-screening-prompt",
  maxDuration: 300,
  run: async (payload: { vacancyId: string; description: string }) => {
    logger.log("🎯 Генерация промпта для скрининга резюме", {
      vacancyId: payload.vacancyId,
    });

    try {
      const prompt = await generateScreeningPrompt(
        payload.vacancyId,
        payload.description
      );

      logger.log("✅ Промпт успешно сгенерирован", {
        vacancyId: payload.vacancyId,
        promptLength: prompt.length,
      });

      return {
        success: true,
        vacancyId: payload.vacancyId,
        prompt,
      };
    } catch (error) {
      logger.error("❌ Ошибка генерации промпта", {
        vacancyId: payload.vacancyId,
        error,
      });
      throw error;
    }
  },
});
