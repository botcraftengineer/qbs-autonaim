import { z } from "zod";

export const updateVacancySettingsSchema = z.object({
  customBotInstructions: z
    .string()
    .max(5000, "Инструкции не должны превышать 5000 символов")
    .optional()
    .nullable(),
  customScreeningPrompt: z
    .string()
    .max(5000, "Промпт не должен превышать 5000 символов")
    .optional()
    .nullable(),
  customInterviewQuestions: z
    .string()
    .max(5000, "Вопросы не должны превышать 5000 символов")
    .optional()
    .nullable(),
});

export type UpdateVacancySettingsInput = z.infer<
  typeof updateVacancySettingsSchema
>;
