import { z } from "zod";

/**
 * Zod схема для требований к опыту
 */
const experienceYearsSchema = z.object({
  min: z.number().optional().nullable(),
  description: z.string(),
});

/**
 * Zod схема для языковых требований
 */
const languageSchema = z.object({
  language: z.string(),
  level: z.string(),
});

/**
 * Zod схема для структурированных требований вакансии
 */
export const vacancyRequirementsSchema = z.object({
  job_title: z.string(),
  summary: z.string(),
  mandatory_requirements: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()),
  tech_stack: z.array(z.string()),
  experience_years: experienceYearsSchema,
  languages: z.array(languageSchema),
  location_type: z.string(),
  keywords_for_matching: z.array(z.string()),
});

export type VacancyRequirementsSchema = z.infer<
  typeof vacancyRequirementsSchema
>;
