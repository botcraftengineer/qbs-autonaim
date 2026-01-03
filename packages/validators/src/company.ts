import { z } from "zod";

export const companyFormSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  website: z.url({ error: "Некорректный URL" }).optional().or(z.literal("")),
  description: z.string().optional(),
  botName: z.string().min(1, "Имя бота обязательно"),
  botRole: z.string().min(1, "Роль бота обязательна"),
});

export const companyPartialSchema = z.object({
  name: z.string().min(1, "Название обязательно").optional(),
  website: z.url({ error: "Некорректный URL" }).optional().or(z.literal("")),
  description: z.string().optional(),
  botName: z.string().min(1, "Имя бота обязательно").optional(),
  botRole: z.string().min(1, "Роль бота обязательна").optional(),
});

export type CompanyFormValues = z.infer<typeof companyFormSchema>;
export type CompanyPartialValues = z.infer<typeof companyPartialSchema>;
