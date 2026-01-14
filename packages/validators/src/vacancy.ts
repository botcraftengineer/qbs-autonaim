import { z } from "zod";

export const updateVacancyDetailsSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Название вакансии обязательно" })
    .max(500, { message: "Название не должно превышать 500 символов" }),
  description: z
    .string()
    .max(50000, { message: "Описание не должно превышать 50000 символов" })
    .nullish(),
});

export type UpdateVacancyDetailsInput = z.infer<
  typeof updateVacancyDetailsSchema
>;

export const updateVacancySettingsSchema = z.object({
  customBotInstructions: z
    .string()
    .max(5000, { message: "Инструкции не должны превышать 5000 символов" })
    .nullish(),
  customScreeningPrompt: z
    .string()
    .max(5000, { message: "Промпт не должен превышать 5000 символов" })
    .nullish(),
  customInterviewQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .nullish(),
  customOrganizationalQuestions: z
    .string()
    .max(5000, { message: "Вопросы не должны превышать 5000 символов" })
    .nullish(),
  // Привязка к внешней платформе
  source: z.enum(["HH", "KWORK", "FL_RU", "FREELANCE_RU", "AVITO", "SUPERJOB", "HABR", "WEB_LINK"])
    .nullish(),
  externalId: z
    .string()
    .max(100, { message: "External ID не должен превышать 100 символов" })
    .nullish(),
  url: z
    .string()
    .url({ message: "Введите корректный URL" })
    .nullish()
    .or(z.literal("")),
});

export type UpdateVacancySettingsInput = z.infer<
  typeof updateVacancySettingsSchema
>;
