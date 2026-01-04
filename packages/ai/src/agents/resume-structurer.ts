/**
 * Агент для структурирования резюме
 *
 * Извлекает структурированные данные из сырого текста резюме.
 */

import { z } from "zod";
import { type AgentConfig, BaseAgent } from "./base-agent";
import { AgentType } from "./types";

export interface ResumeStructurerInput {
  rawText: string;
}

const workExperienceSchema = z.object({
  company: z.string(),
  position: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  isCurrent: z.boolean(),
});

const educationSchema = z.object({
  institution: z.string(),
  degree: z.string().optional(),
  field: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const languageSchema = z.object({
  name: z.string(),
  level: z.string(),
});

const personalInfoSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  location: z.string().optional(),
});

const resumeStructurerOutputSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(workExperienceSchema),
  education: z.array(educationSchema),
  skills: z.array(z.string()),
  languages: z.array(languageSchema),
  summary: z.string().optional(),
});

export type ResumeStructurerOutput = z.infer<
  typeof resumeStructurerOutputSchema
>;

export class ResumeStructurerAgent extends BaseAgent<
  ResumeStructurerInput,
  ResumeStructurerOutput
> {
  constructor(config: AgentConfig) {
    const instructions = `Ты — эксперт по анализу резюме. Твоя задача — извлечь структурированные данные из текста резюме.

ЗАДАЧА:
Проанализируй текст резюме и извлеки следующую информацию:

1. ЛИЧНАЯ ИНФОРМАЦИЯ (personalInfo):
   - name: ФИО кандидата
   - email: электронная почта
   - phone: телефон (в любом формате)
   - location: город/страна проживания

2. ОПЫТ РАБОТЫ (experience):
   Для каждой позиции извлеки:
   - company: название компании
   - position: должность
   - startDate: дата начала (формат: "YYYY-MM" или "YYYY")
   - endDate: дата окончания (формат: "YYYY-MM" или "YYYY", пусто если текущая)
   - description: описание обязанностей и достижений
   - isCurrent: true если это текущее место работы

3. ОБРАЗОВАНИЕ (education):
   Для каждого учебного заведения:
   - institution: название учебного заведения
   - degree: степень/квалификация (бакалавр, магистр, и т.д.)
   - field: специальность/направление
   - startDate: год начала
   - endDate: год окончания

4. НАВЫКИ (skills):
   Список технических и профессиональных навыков

5. ЯЗЫКИ (languages):
   Для каждого языка:
   - language: название языка
   - level: уровень владения (родной, свободный, продвинутый, средний, базовый)

6. КРАТКОЕ ОПИСАНИЕ (summary):
   Краткое профессиональное резюме кандидата (если есть в тексте)

ПРАВИЛА:
- Извлекай только то, что явно указано в тексте
- Не придумывай информацию
- Если поле не найдено, оставь его пустым или не включай
- Даты форматируй как "YYYY-MM" или "YYYY"
- Опыт работы сортируй от новейшего к старейшему
- Навыки извлекай как отдельные элементы списка`;

    super(
      "ResumeStructurer",
      AgentType.CONTEXT_ANALYZER,
      instructions,
      resumeStructurerOutputSchema,
      config,
    );
  }

  protected validate(input: ResumeStructurerInput): boolean {
    return typeof input.rawText === "string" && input.rawText.length > 0;
  }

  protected buildPrompt(input: ResumeStructurerInput): string {
    return `ТЕКСТ РЕЗЮМЕ:
${input.rawText}

Извлеки структурированные данные из этого резюме.`;
  }
}
