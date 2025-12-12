import { z } from "zod";

export const updateVacancySettingsSchema = z.object({
  customBotInstructions: z
    .string()
    .max(5000, { message: "Инструкции не должны превышать 5000 символов" })
    .optional()
    .nullable(),
  customScreeningPrompt: z
    .string()
    .max(5000, { message: "Промпт не должен превышать 5000 символов" })
    .optional()
    .nullable(),
  customInterviewQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .optional()
    .nullable(),
});

export type UpdateVacancySettingsInput = z.infer<
  typeof updateVacancySettingsSchema
>;
