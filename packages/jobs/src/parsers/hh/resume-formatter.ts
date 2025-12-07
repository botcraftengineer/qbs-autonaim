import { deepseek } from "@ai-sdk/deepseek";
import {
  buildAboutFormattingPrompt,
  buildCoursesFormattingPrompt,
  buildEducationFormattingPrompt,
  buildExperienceFormattingPrompt,
  buildLanguagesFormattingPrompt,
  RESUME_FORMATTER_SYSTEM_PROMPT,
} from "@selectio/prompts";
import { generateText } from "ai";
import type { ResumeExperience } from "../types";

interface FormattedResumeData {
  experience: string;
  languages: string;
  about: string;
  education: string;
  courses: string;
}

/**
 * Форматирует секцию резюме через DeepSeek
 */
async function formatSection(
  sectionType: "experience" | "languages" | "about" | "education" | "courses",
  rawHtml: string,
): Promise<string> {
  if (!rawHtml || rawHtml.trim() === "") {
    return "";
  }

  const promptBuilders = {
    experience: buildExperienceFormattingPrompt,
    languages: buildLanguagesFormattingPrompt,
    about: buildAboutFormattingPrompt,
    education: buildEducationFormattingPrompt,
    courses: buildCoursesFormattingPrompt,
  };

  const userPrompt = promptBuilders[sectionType](rawHtml);

  try {
    const result = await generateText({
      model: deepseek("deepseek-chat"),
      system: RESUME_FORMATTER_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.1, // Низкая температура для точности
    });

    return result.text.trim();
  } catch (error) {
    console.log(`⚠️ Ошибка форматирования ${sectionType}:`, error);
    return rawHtml; // Возвращаем исходный HTML в случае ошибки
  }
}

/**
 * Форматирует все данные резюме через DeepSeek
 */
export async function formatResumeData(
  rawData: ResumeExperience,
): Promise<FormattedResumeData> {
  console.log("🤖 Начинаем форматирование данных резюме через DeepSeek...");

  const [experience, languages, about, education, courses] = await Promise.all([
    formatSection("experience", rawData.experience),
    formatSection("languages", rawData.languages),
    formatSection("about", rawData.about),
    formatSection("education", rawData.education),
    formatSection("courses", rawData.courses),
  ]);

  console.log("✅ Форматирование завершено");

  return {
    experience,
    languages,
    about,
    education,
    courses,
  };
}
