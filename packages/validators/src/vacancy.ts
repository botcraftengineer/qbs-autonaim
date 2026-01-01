import { z } from "zod";

export const updateVacancyDetailsSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Название вакансии обязательно" })
    .max(500, { message: "Название не должно превышать 500 символов" }),
  description: z
    .string()
    .max(50000, { message: "Описание не должно превышать 50000 символов" })
    .optional()
    .nullable(),
});

export type UpdateVacancyDetailsInput = z.infer<
  typeof updateVacancyDetailsSchema
>;

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
  customOrganizationalQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .optional()
    .nullable(),
});

export type UpdateVacancySettingsInput = z.infer<
  typeof updateVacancySettingsSchema
>;
