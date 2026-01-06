/**
 * Feedback Generator Service
 *
 * Сервис для генерации обратной связи кандидатам на основе результатов оценки.
 * Учитывает настройки honestyLevel для адаптации тона и содержания feedback.
 */

import type { EvaluationResult, HonestyLevel } from "@qbs-autonaim/db";
import { generateText } from "@qbs-autonaim/lib/ai";

import type { FeedbackConfig } from "./types";
import { EvaluationError } from "./types";

/**
 * Минимальная длина feedback в символах
 */
const MIN_FEEDBACK_LENGTH = 50;

/**
 * Конфигурация промптов для разных уровней честности
 */
const HONESTY_LEVEL_PROMPTS: Record<HonestyLevel, string> = {
  direct: `Будь прямым и честным в обратной связи. Чётко укажи на несоответствия и области для улучшения.
Не смягчай формулировки, но оставайся профессиональным и уважительным.
Кандидат должен получить ясное понимание своих сильных и слабых сторон.`,

  diplomatic: `Используй дипломатичный подход в обратной связи. Начни с позитивных аспектов, затем мягко укажи на области для развития.
Формулируй критику конструктивно, предлагая пути улучшения.
Сохраняй баланс между честностью и тактичностью.`,

  encouraging: `Используй поддерживающий и ободряющий тон. Акцентируй внимание на сильных сторонах и потенциале кандидата.
Области для улучшения представляй как возможности для роста.
Мотивируй кандидата продолжать развиваться, даже если текущее соответствие недостаточное.`,
};

/**
 * Конфигурация тона для разных стилей общения
 */
const TONE_PROMPTS: Record<"formal" | "friendly", string> = {
  formal: `Используй формальный, деловой стиль общения. Обращайся на "Вы".
Избегай разговорных выражений и эмоциональных оценок.`,

  friendly: `Используй дружелюбный, но профессиональный стиль. Можно обращаться на "ты".
Допустимы тёплые формулировки, но сохраняй профессионализм.`,
};

/**
 * Шаблоны для разных решений о соответствии
 */
const FIT_DECISION_CONTEXT: Record<
  EvaluationResult["fitDecision"],
  { context: string; focus: string }
> = {
  strong_fit: {
    context:
      "Кандидат отлично подходит для вакансии. Это позитивный результат.",
    focus:
      "Подчеркни сильные стороны и объясни, почему кандидат хорошо подходит. Пригласи продолжить процесс отклика.",
  },
  potential_fit: {
    context:
      "Кандидат потенциально подходит для вакансии, но есть области для обсуждения.",
    focus:
      "Отметь сильные стороны и честно укажи на области, которые могут потребовать дополнительного обсуждения. Предложи продолжить процесс.",
  },
  not_fit: {
    context: "Кандидат не соответствует требованиям вакансии на данный момент.",
    focus:
      "Конструктивно объясни причины несоответствия. Предложи конкретные области для развития. Поблагодари за интерес и пожелай успехов.",
  },
};

/**
 * Сервис генерации обратной связи для кандидатов
 */
export class FeedbackGeneratorService {
  /**
   * Генерирует персонализированную обратную связь для кандидата
   */
  async generateFeedback(
    evaluationResult: EvaluationResult,
    config: FeedbackConfig,
  ): Promise<string> {
    const { honestyLevel, tone, fitDecision, fitScore, vacancyTitle } = config;

    try {
      const prompt = this.buildFeedbackPrompt(
        evaluationResult,
        honestyLevel,
        tone,
        fitDecision,
        fitScore,
        vacancyTitle,
      );

      const { text } = await generateText({
        prompt,
        generationName: "generate-candidate-feedback",
        metadata: {
          fitDecision,
          fitScore,
          honestyLevel,
          tone,
        },
      });

      const feedback = this.cleanFeedback(text);

      // Валидация минимальной длины
      if (feedback.length < MIN_FEEDBACK_LENGTH) {
        throw new Error(
          `Feedback слишком короткий: ${feedback.length} символов`,
        );
      }

      return feedback;
    } catch (error) {
      if (error instanceof EvaluationError) {
        throw error;
      }

      throw new EvaluationError(
        "FEEDBACK_GENERATION_FAILED",
        "Не удалось сгенерировать обратную связь. Попробуйте позже.",
        { originalError: String(error) },
      );
    }
  }

  /**
   * Формирует промпт для генерации feedback
   */
  private buildFeedbackPrompt(
    evaluation: EvaluationResult,
    honestyLevel: HonestyLevel,
    tone: "formal" | "friendly",
    fitDecision: EvaluationResult["fitDecision"],
    fitScore: number,
    vacancyTitle: string,
  ): string {
    const honestyInstruction = HONESTY_LEVEL_PROMPTS[honestyLevel];
    const toneInstruction = TONE_PROMPTS[tone];
    const decisionContext = FIT_DECISION_CONTEXT[fitDecision];

    // Форматируем оценки по dimensions
    const dimensionsText = this.formatDimensions(evaluation.dimensions);

    return `Ты — AI-ассистент по подбору персонала. Сгенерируй персонализированную обратную связь для кандидата по результатам преквалификации.

НАСТРОЙКИ ОБРАТНОЙ СВЯЗИ:
${honestyInstruction}

${toneInstruction}

КОНТЕКСТ:
${decisionContext.context}

ФОКУС ОБРАТНОЙ СВЯЗИ:
${decisionContext.focus}

ДАННЫЕ ОЦЕНКИ:
Вакансия: ${vacancyTitle}
Общая оценка соответствия: ${fitScore}%
Решение: ${this.translateFitDecision(fitDecision)}

Оценки по критериям:
${dimensionsText}

Сильные стороны:
${evaluation.strengths.map((s) => `- ${s}`).join("\n")}

Области для развития:
${evaluation.risks.map((r) => `- ${r}`).join("\n")}

ТРЕБОВАНИЯ К ОТВЕТУ:
1. Напиши обратную связь от первого лица (от имени AI-ассистента)
2. Длина: 150-300 слов
3. Структура:
   - Приветствие и благодарность за прохождение преквалификации
   - Основная часть с оценкой соответствия
   - Конкретные рекомендации или следующие шаги
4. НЕ используй markdown-разметку
5. НЕ указывай числовые оценки напрямую (не пиши "75%")
6. Пиши естественным языком, как будто общаешься с человеком

ОТВЕТ (только текст обратной связи, без дополнительных комментариев):`;
  }

  /**
   * Форматирует оценки по dimensions для промпта
   */
  private formatDimensions(dimensions: EvaluationResult["dimensions"]): string {
    const labels: Record<keyof EvaluationResult["dimensions"], string> = {
      hardSkills: "Технические навыки",
      softSkills: "Soft skills",
      cultureFit: "Культурное соответствие",
      salaryAlignment: "Зарплатные ожидания",
    };

    return Object.entries(dimensions)
      .map(([key, value]) => {
        const label = labels[key as keyof typeof labels];
        const level = this.scoreToLevel(value.score);
        return `- ${label}: ${level}${value.notes ? ` (${value.notes})` : ""}`;
      })
      .join("\n");
  }

  /**
   * Преобразует числовую оценку в текстовый уровень
   */
  private scoreToLevel(score: number): string {
    if (score >= 80) return "отлично";
    if (score >= 60) return "хорошо";
    if (score >= 40) return "удовлетворительно";
    return "требует развития";
  }

  /**
   * Переводит fitDecision на русский
   */
  private translateFitDecision(
    decision: EvaluationResult["fitDecision"],
  ): string {
    const translations: Record<EvaluationResult["fitDecision"], string> = {
      strong_fit: "Отличное соответствие",
      potential_fit: "Потенциальное соответствие",
      not_fit: "Недостаточное соответствие",
    };
    return translations[decision];
  }

  /**
   * Очищает и нормализует текст feedback
   */
  private cleanFeedback(text: string): string {
    return (
      text
        .trim()
        // Удаляем возможные markdown-заголовки
        .replace(/^#+\s+/gm, "")
        // Удаляем лишние пустые строки
        .replace(/\n{3,}/g, "\n\n")
        // Удаляем возможные кавычки в начале и конце
        .replace(/^["']|["']$/g, "")
        .trim()
    );
  }
}

/**
 * Singleton instance
 */
export const feedbackGeneratorService = new FeedbackGeneratorService();
