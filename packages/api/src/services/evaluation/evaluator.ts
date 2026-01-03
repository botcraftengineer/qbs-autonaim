/**
 * Evaluation Service - Evaluator
 *
 * Сервис для оценки соответствия кандидатов вакансиям с использованием AI.
 * Рассчитывает scores по различным dimensions и определяет fitDecision.
 */

import type {
  EvaluationResult,
  FitDecision,
  ParsedResume,
} from "@qbs-autonaim/db";
import { generateText } from "@qbs-autonaim/lib/ai";

import type {
  DialogueMessage,
  EvaluationInput,
  VacancyData,
  WorkspaceEvaluationConfig,
} from "./types";
import { EvaluationError } from "./types";

/**
 * Zod-like schema for validating AI response
 */
interface AIEvaluationResponse {
  fitScore: number;
  dimensions: {
    hardSkills: { score: number; confidence: number; notes: string };
    softSkills: { score: number; confidence: number; notes: string };
    cultureFit: { score: number; confidence: number; notes: string };
    salaryAlignment: { score: number; confidence: number; notes: string };
  };
  strengths: string[];
  risks: string[];
  recommendation: string;
  aiSummary: string;
}

/**
 * Сервис оценки кандидатов
 */
export class EvaluatorService {
  /**
   * Оценивает кандидата на основе резюме, диалога и требований вакансии
   */
  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const { parsedResume, dialogueHistory, vacancy, workspaceConfig } = input;

    // Валидация входных данных
    this.validateInput(input);

    try {
      // Формируем промпт для AI
      const prompt = this.buildEvaluationPrompt(
        parsedResume,
        dialogueHistory,
        vacancy,
        workspaceConfig,
      );

      // Получаем оценку от AI
      const { text } = await generateText({
        prompt,
        generationName: "evaluate-candidate",
        metadata: {
          vacancyId: vacancy.id,
          vacancyTitle: vacancy.title,
        },
      });

      // Парсим ответ AI
      const aiResponse = this.parseAIResponse(text);

      // Определяем fitDecision на основе threshold
      const fitDecision = this.determineFitDecision(
        aiResponse.fitScore,
        workspaceConfig.passThreshold,
      );

      // Формируем результат
      const result: EvaluationResult = {
        fitScore: aiResponse.fitScore,
        fitDecision,
        dimensions: aiResponse.dimensions,
        strengths: aiResponse.strengths,
        risks: aiResponse.risks,
        recommendation: aiResponse.recommendation,
        aiSummary: aiResponse.aiSummary,
      };

      return result;
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error;
      }

      throw new EvaluationError(
        "AI_SERVICE_ERROR",
        "Сервис оценки временно недоступен. Попробуйте позже.",
        { originalError: String(error) },
      );
    }
  }

  /**
   * Валидирует входные данные для оценки
   */
  private validateInput(input: EvaluationInput): void {
    const { parsedResume, dialogueHistory, vacancy } = input;

    if (!parsedResume?.structured) {
      throw new EvaluationError(
        "INSUFFICIENT_DATA",
        "Недостаточно данных из резюме для оценки",
        { field: "parsedResume" },
      );
    }

    if (!dialogueHistory || dialogueHistory.length === 0) {
      throw new EvaluationError(
        "INSUFFICIENT_DATA",
        "Недостаточно информации из диалога для оценки",
        { field: "dialogueHistory" },
      );
    }

    if (!vacancy?.title) {
      throw new EvaluationError(
        "INSUFFICIENT_DATA",
        "Отсутствуют данные о вакансии",
        { field: "vacancy" },
      );
    }
  }

  /**
   * Формирует промпт для AI оценки
   */
  private buildEvaluationPrompt(
    parsedResume: ParsedResume,
    dialogueHistory: DialogueMessage[],
    vacancy: VacancyData,
    config: WorkspaceEvaluationConfig,
  ): string {
    const { structured } = parsedResume;

    // Форматируем опыт работы
    const experienceText = structured.experience
      .map((exp) => {
        const period = exp.isCurrent
          ? `${exp.startDate || "?"} - настоящее время`
          : `${exp.startDate || "?"} - ${exp.endDate || "?"}`;
        return `- ${exp.position} в ${exp.company} (${period})${exp.description ? `\n  ${exp.description}` : ""}`;
      })
      .join("\n");

    // Форматируем образование
    const educationText = structured.education
      .map(
        (edu) => `- ${edu.degree || ""} ${edu.field || ""}, ${edu.institution}`,
      )
      .join("\n");

    // Форматируем диалог
    const dialogueText = dialogueHistory
      .map(
        (msg) =>
          `${msg.role === "assistant" ? "AI" : "Кандидат"}: ${msg.content}`,
      )
      .join("\n\n");

    // Форматируем требования вакансии
    const requirementsText = vacancy.requirements
      ? this.formatVacancyRequirements(vacancy.requirements)
      : "Требования не указаны";

    const toneInstruction =
      config.tone === "formal"
        ? "Используй формальный, деловой стиль в оценке."
        : "Используй дружелюбный, но профессиональный стиль в оценке.";

    return `Ты — эксперт по подбору персонала. Проведи комплексную оценку соответствия кандидата вакансии.

${toneInstruction}

ВАКАНСИЯ:
Название: ${vacancy.title}
Описание: ${vacancy.description || "Не указано"}

ТРЕБОВАНИЯ:
${requirementsText}

РЕЗЮМЕ КАНДИДАТА:
Имя: ${structured.personalInfo.name || "Не указано"}
Локация: ${structured.personalInfo.location || "Не указана"}

Опыт работы:
${experienceText || "Не указан"}

Образование:
${educationText || "Не указано"}

Навыки: ${structured.skills.join(", ") || "Не указаны"}

Языки: ${structured.languages.map((l) => `${l.language} (${l.level})`).join(", ") || "Не указаны"}

${structured.summary ? `О себе: ${structured.summary}` : ""}

ДИАЛОГ С КАНДИДАТОМ:
${dialogueText}

ЗАДАЧА:
Оцени кандидата по следующим критериям (каждый от 0 до 100):

1. hardSkills - соответствие технических навыков требованиям
2. softSkills - коммуникативные навыки, работа в команде, адаптивность
3. cultureFit - соответствие корпоративной культуре и ценностям
4. salaryAlignment - соответствие зарплатных ожиданий (если обсуждалось)

Для каждого критерия укажи:
- score: оценка от 0 до 100
- confidence: уверенность в оценке от 0 до 1
- notes: краткое обоснование оценки

Также определи:
- fitScore: общая оценка соответствия от 0 до 100
- strengths: массив сильных сторон кандидата (2-4 пункта)
- risks: массив потенциальных рисков (1-3 пункта)
- recommendation: рекомендация для рекрутера (2-3 предложения)
- aiSummary: краткое резюме для компании (3-5 предложений)

ФОРМАТ ОТВЕТА (только JSON):
{
  "fitScore": число от 0 до 100,
  "dimensions": {
    "hardSkills": { "score": число, "confidence": число, "notes": "текст" },
    "softSkills": { "score": число, "confidence": число, "notes": "текст" },
    "cultureFit": { "score": число, "confidence": число, "notes": "текст" },
    "salaryAlignment": { "score": число, "confidence": число, "notes": "текст" }
  },
  "strengths": ["сильная сторона 1", "сильная сторона 2"],
  "risks": ["риск 1", "риск 2"],
  "recommendation": "рекомендация для рекрутера",
  "aiSummary": "краткое резюме для компании"
}`;
  }

  /**
   * Форматирует требования вакансии
   */
  private formatVacancyRequirements(
    requirements: VacancyData["requirements"],
  ): string {
    if (!requirements) return "Не указаны";

    const parts: string[] = [];

    if (requirements.hardSkills?.length) {
      parts.push(`Обязательные навыки: ${requirements.hardSkills.join(", ")}`);
    }

    if (requirements.softSkills?.length) {
      parts.push(`Soft skills: ${requirements.softSkills.join(", ")}`);
    }

    if (requirements.minExperience !== undefined) {
      parts.push(`Минимальный опыт: ${requirements.minExperience} лет`);
    }

    if (requirements.education?.length) {
      parts.push(`Образование: ${requirements.education.join(", ")}`);
    }

    if (requirements.salaryRange) {
      const { min, max, currency } = requirements.salaryRange;
      const range =
        min && max
          ? `${min} - ${max} ${currency || ""}`
          : min
            ? `от ${min} ${currency || ""}`
            : max
              ? `до ${max} ${currency || ""}`
              : "не указан";
      parts.push(`Зарплата: ${range}`);
    }

    if (requirements.other?.length) {
      parts.push(`Дополнительно: ${requirements.other.join(", ")}`);
    }

    return parts.join("\n") || "Не указаны";
  }

  /**
   * Парсит ответ AI в структурированный формат
   */
  private parseAIResponse(text: string): AIEvaluationResponse {
    try {
      // Извлекаем JSON из ответа
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("JSON не найден в ответе AI");
      }

      const parsed = JSON.parse(jsonMatch[0]) as AIEvaluationResponse;

      // Валидируем обязательные поля
      if (
        typeof parsed.fitScore !== "number" ||
        parsed.fitScore < 0 ||
        parsed.fitScore > 100
      ) {
        throw new Error("Некорректный fitScore");
      }

      if (!parsed.dimensions) {
        throw new Error("Отсутствуют dimensions");
      }

      // Валидируем каждый dimension
      const requiredDimensions = [
        "hardSkills",
        "softSkills",
        "cultureFit",
        "salaryAlignment",
      ] as const;
      for (const dim of requiredDimensions) {
        const dimension = parsed.dimensions[dim];
        if (!dimension || typeof dimension.score !== "number") {
          throw new Error(`Некорректный dimension: ${dim}`);
        }
        // Нормализуем значения
        dimension.score = Math.max(
          0,
          Math.min(100, Math.round(dimension.score)),
        );
        dimension.confidence = Math.max(
          0,
          Math.min(1, dimension.confidence || 0.5),
        );
        dimension.notes = dimension.notes || "";
      }

      // Нормализуем массивы
      parsed.strengths = Array.isArray(parsed.strengths)
        ? parsed.strengths
        : [];
      parsed.risks = Array.isArray(parsed.risks) ? parsed.risks : [];
      parsed.recommendation = parsed.recommendation || "";
      parsed.aiSummary = parsed.aiSummary || "";

      return parsed;
    } catch (error) {
      throw new EvaluationError(
        "INVALID_EVALUATION_RESULT",
        "Не удалось обработать результат оценки",
        { originalError: String(error), rawText: text.substring(0, 500) },
      );
    }
  }

  /**
   * Определяет fitDecision на основе fitScore и threshold
   */
  private determineFitDecision(
    fitScore: number,
    passThreshold: number,
  ): FitDecision {
    if (fitScore >= passThreshold + 15) {
      return "strong_fit";
    }
    if (fitScore >= passThreshold) {
      return "potential_fit";
    }
    return "not_fit";
  }
}

/**
 * Singleton instance
 */
export const evaluatorService = new EvaluatorService();
