import { logger, task } from "@trigger.dev/sdk";
import { extractVacancyRequirements } from "../services/screening-prompt-service";

export const extractVacancyRequirementsTask = task({
  id: "extract-vacancy-requirements",
  maxDuration: 300,
  run: async (payload: { vacancyId: string; description: string }) => {
    logger.log("🎯 Извлечение требований вакансии через AI", {
      vacancyId: payload.vacancyId,
    });

    try {
      const requirements = await extractVacancyRequirements(
        payload.vacancyId,
        payload.description
      );

      logger.log("✅ Требования успешно извлечены и сохранены", {
        vacancyId: payload.vacancyId,
        jobTitle: requirements.job_title,
        mandatoryCount: requirements.mandatory_requirements.length,
        techStackCount: requirements.tech_stack.length,
      });

      return {
        success: true,
        vacancyId: payload.vacancyId,
        requirements,
      };
    } catch (error) {
      logger.error("❌ Ошибка генерации требований", {
        vacancyId: payload.vacancyId,
        error,
      });
      throw error;
    }
  },
});
